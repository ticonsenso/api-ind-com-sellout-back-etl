import { plainToClass, plainToInstance } from 'class-transformer';
import { DataSource } from 'typeorm';
import { ExtractedDataSelloutRepository } from '../repository/extrated.data.sellout.repository';
import { SelloutConfiguration } from '../models/sellout.configuration.model';
import { ExtractionLogsSellout } from '../models/extraction.logs.sellout.model';
import { CreateExtractedDataSelloutDto, ExtractedDataSelloutDto, ExtractedDataSelloutFiltersResponseDto, UpdateExtractedDataSelloutDto } from '../dtos/extrated.data.sellout.dto';
import { ExtractedDataSellout } from '../models/extracted.data.sellout.model';
import { User } from '../models/users.model';
import { UserConsenso } from '../interfaces/user.consenso';
import { UserRepository } from '../repository/users.repository';
import { ConsolidatedDataStoresService } from './consolidated.data.stores.service';
import { SelloutConfigurationRepository } from '../repository/sellout.configuration.repository';
import { ExtractionLogsSelloutRepository } from '../repository/extraction.logs.sellout.repositoy';
import { MatriculationTemplatesRepository } from '../repository/matriculation.templates.repository';
import { MatriculationLogsRepository } from '../repository/matriculation.logs.repostitory';
import { MatriculationService } from './matriculation.service';
import { parseDateFromISO } from '../utils/utils';
import { ConsolidatedDataStoresRepository } from '../repository/consolidated.data.stores.repository';
import { MatriculationTemplate } from '../models/matriculation.templates.model';
import { MatriculationLog } from '../models/matriculation.logs.model';
import { CreateMatriculationLogDto } from '../dtos/matriculation.logs.dto';

type ExtractedDataSelloutResponse = {
    message: string;
    extractedData: ExtractedDataSelloutDto | string;
};

interface BasicLogData {
    distributor: string | undefined;
    storeName: string | undefined;
    rowsCount: number;
    productCount: number;
}
export class ExtratedDataSelloutService {

    private extractedDataSelloutRepository: ExtractedDataSelloutRepository;
    private userRepository: UserRepository;
    private extractionLogsSelloutRepository: ExtractionLogsSelloutRepository;
    private consolidatedDataStoresService: ConsolidatedDataStoresService;
    private matriculationService: MatriculationService;
    private selloutConfigurationRepository: SelloutConfigurationRepository;
    private matriculationTemplateRepository: MatriculationTemplatesRepository;
    private matriculationLogsRepository: MatriculationLogsRepository;
    private consolidatedDataStoresRepository: ConsolidatedDataStoresRepository;
    constructor(dataSource: DataSource) {
        this.extractedDataSelloutRepository = new ExtractedDataSelloutRepository(dataSource);
        this.userRepository = new UserRepository(dataSource);
        this.consolidatedDataStoresService = new ConsolidatedDataStoresService(dataSource);
        this.selloutConfigurationRepository = new SelloutConfigurationRepository(dataSource);
        this.matriculationTemplateRepository = new MatriculationTemplatesRepository(dataSource);
        this.consolidatedDataStoresRepository = new ConsolidatedDataStoresRepository(dataSource);
        this.matriculationLogsRepository = new MatriculationLogsRepository(dataSource);
        this.matriculationService = new MatriculationService(dataSource);
        this.createExtractedDataSellout = this.createExtractedDataSellout.bind(this);
        this.updateExtractedDataSellout = this.updateExtractedDataSellout.bind(this);
        this.deleteExtractedDataSellout = this.deleteExtractedDataSellout.bind(this);
        this.extractionLogsSelloutRepository = new ExtractionLogsSelloutRepository(dataSource);
        this.getFilteredExtractedDataSellout = this.getFilteredExtractedDataSellout.bind(this);
    }

    async createExtractedDataSellout(
        dto: CreateExtractedDataSelloutDto,
        userConsenso: UserConsenso
    ): Promise<ExtractedDataSelloutResponse | string | { distributor: string; storeName: string; status: boolean }> {
        const start = new Date();

        // Paso 1: Obtener los datos consolidado y logs
        const entityExtractedData = await this.prepareExtractedEntity(dto, userConsenso);
        const dataConsolidado = this.parseDataContent(dto); // { consolidated_data_stores, dataBlockName }
        const records = dataConsolidado[entityExtractedData.dataName!];
        const logsFromDto = this.parseDataLogs(dto); // puede venir vacío
        const firstRecord = records[0];

        // Paso 2: Ver si existe la matriculación. Si no, matricular.
        // const template = await this.getOrCreateMatriculationTemplate(
        //     dto.templateName!,
        //     dto.matriculationId!,
        //     logsFromDto.length > 1 ? logsFromDto[0].distributor ?? '' : firstRecord.distributor ?? '',
        //     logsFromDto.length > 1 ? 'VARIOS' : firstRecord.codeStoreDistributor ?? '');
        let template = await this.matriculationTemplateRepository.findById(dto.matriculationId!);
        if (!template) {
            throw new Error(`Matriculación con ID ${dto.matriculationId} no encontrada`);
        } else {
            await this.matriculationService.updateMatriculationTemplate(
                dto.matriculationId!,
                {
                    distributor: logsFromDto.length > 1 ? logsFromDto[0].distributor ?? '' :
                        firstRecord.distributor ?? '',
                    storeName: logsFromDto.length > 1 ? '' :
                        firstRecord.codeStoreDistributor ?? ''
                });
            template = await this.matriculationTemplateRepository.findById(dto.matriculationId!);
            if (!template) {
                throw new Error(`Matriculación con ID ${dto.matriculationId} no encontrada después de la actualización`);
            }
        }

        let logsToUse: Array<{
            distributor: string | undefined;
            storeName: string | undefined;
            rowsCount: number;
            productCount: number;
        }> = [];

        if (!logsFromDto || logsFromDto.length === 0) {
            logsToUse = [{
                distributor: firstRecord.distributor,
                storeName: firstRecord.codeStoreDistributor,
                rowsCount: dto.recordCount ?? 0,
                productCount: dto.productCount ?? 0,
            }];
        } else {
            logsToUse = logsFromDto!.map((log: any) => ({
                distributor: log.distributor,
                storeName: log.storeName,
                rowsCount: log.rowsCount ?? 0,
                productCount: log.productCount ?? 0
            }));
        }

        // Paso 3: Eliminar logs solo si no hay logs en data logs
        if (dto.uploadCount === 1 && (dto.matriculationLogs && dto.matriculationLogs.length > 0)) {
            await this.matriculationLogsRepository.deleteAllByMatriculationId(dto.matriculationId!, new Date(dto.calculateDate!));
            await this.deleteLogAndAllConsolidatedDataStores(dto.matriculationId!, dto.calculateDate!);
        } else if (dto.uploadCount && dto.uploadCount === 1) {
            const existingLog = await this.matriculationLogsRepository.findByCalculateDateOne(
                dto.calculateDate!,
                dto.matriculationId!
            );
            if (existingLog) {
                for (const log of existingLog) {
                    await this.matriculationLogsRepository.delete(log.id!);
                    await this.consolidatedDataStoresRepository.deleteAllByMatriculationId(dto.matriculationId!, new Date(dto.calculateDate!));
                }
            }
        }

        // Paso 4: Procesar los datos consolidados
        const selloutConfig = await this.selloutConfigurationRepository.findById(dataConsolidado.selloutConfigurationId);
        const result = await this.consolidatedDataStoresService.processConsolidatedDataStores(
            records,
            template.id,
            dto.calculateDate!
        );

        // Paso 5: Guardar o actualizar logs
        if (result.recordCountSaved > 0) {
            await this.saveOrUpdateMatriculationLog(dto, template, logsToUse);
        }

        return {
            message: result.recordCountSaved > 0
                ? 'Datos han sido extraídos correctamente'
                : 'Hubo errores al procesar los datos',
            extractedData: await this.processExtractedData(
                records,
                entityExtractedData,
                dto.recordCount!,
                start,
                result.smsErrors,
                result.smsErrorsBack,
                selloutConfig!,
                result.recordsExtracted,
                result.recordCountSaved,
                result.recordsFailed,
                result.errorMessage,
                result.startTime,
                result.endTime,
                result.status,
                result.executionDetails,
                dto.productCount!
            )
        };
    }

    private async deleteLogAndAllConsolidatedDataStores(templateId: number, calculateDate: string): Promise<void> {
        const existingLog = await this.matriculationLogsRepository.findByCalculateDateOne(calculateDate, templateId);
        if (existingLog) {
            await this.consolidatedDataStoresRepository.deleteAllByMatriculationId(templateId, new Date(calculateDate));
        }
    }

    private async prepareExtractedEntity(
        dto: CreateExtractedDataSelloutDto,
        userConsenso: UserConsenso
    ): Promise<ExtractedDataSellout> {
        const entity = plainToClass(ExtractedDataSellout, dto);
        const user = await this.userRepository.findByDni(userConsenso.cedula);
        if (user) {
            entity.createdBy = user;
            entity.processedBy = user;
        }
        return entity;
    }

    private parseDataContent(dto: CreateExtractedDataSelloutDto): any {
        const data = JSON.parse(JSON.stringify(dto.dataContent));
        const blockName = data.consolidated_data_stores ? 'consolidated_data_stores' : '';
        if (!blockName || !Array.isArray(data[blockName]) || data[blockName].length === 0) {
            throw new Error(`El bloque '${blockName}' no contiene registros o no es un array`);
        }
        return { ...data, dataBlockName: blockName };
    }

    private parseDataLogs(dto: CreateExtractedDataSelloutDto): MatriculationLog[] {
        const data = JSON.parse(JSON.stringify(dto.matriculationLogs));
        return data;
    }

    private async saveOrUpdateMatriculationLog(
        dto: CreateExtractedDataSelloutDto,
        template: MatriculationTemplate,
        logs: Array<{ distributor: string | undefined; storeName: string | undefined; rowsCount: number; productCount: number; }>
    ): Promise<void> {
        const isoDate = parseDateFromISO(dto.calculateDate!);

        for (const log of logs) {
            const logPayload: CreateMatriculationLogDto = {
                calculateDate: isoDate.toISOString(),
                matriculationId: template.id!,
                rowsCount: log.rowsCount ?? 0,
                productCount: log.productCount ?? 0,
                uploadTotal: dto.uploadTotal ?? 1,
                uploadCount: dto.uploadCount ?? 1,
                distributor: log.distributor,
                storeName: log.storeName
            };

            // Buscar si ya existe un log con la misma combinación
            const existing = await this.matriculationLogsRepository.findByMatriculationIdAndCalculateDate(
                template.id!,
                dto.calculateDate!,
                log.distributor ?? '',
                log.storeName ?? ''
            );

            if (!existing) {
                await this.matriculationService.createMatriculationLog(logPayload);
            } else {
                await this.matriculationService.updateMatriculationLog(existing.id!, logPayload);
            }
        }
    }

    private async processExtractedData(
        data: any,
        entityExtractedData: ExtractedDataSellout,
        recordCount: number,
        start: Date,
        smsErrors: string[] = [],
        smsErrorsBack: string[] = [],
        selloutConfiguration: SelloutConfiguration,
        recordsExtracted: number,
        recordsProcessed: number,
        recordsFailed: number,
        errorMessage: string | undefined,
        startTime: Date,
        endTime: Date,
        status: string,
        executionDetails: object,
        productCount: number
    ): Promise<ExtractedDataSelloutDto> {
        const groupedSmsErrors = Object.entries(
            smsErrors.reduce((acc, error) => {
                acc[error] = (acc[error] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([error, count]) => count > 1 ? `${error} (x${count})` : error);

        const groupedSmsErrorsBack = Object.entries(
            smsErrorsBack.reduce((acc, error) => {
                acc[error] = (acc[error] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([error, count]) => count > 1 ? `${error} (x${count})` : error);
        entityExtractedData.recordCount = recordCount;
        entityExtractedData.isProcessed = true;
        entityExtractedData.processedDate = new Date();
        entityExtractedData.processingDetails = {
            duration: new Date().getTime() - start.getTime(),
            error: recordsFailed,
            smsErrors: groupedSmsErrors,
            smsErrorsBack: groupedSmsErrorsBack,
            resumen: {
                total: recordsExtracted,
                success: recordCount,
                failed: recordsFailed
            }
        };

        entityExtractedData.selloutConfiguration = selloutConfiguration;
        const extractedData =
            await this.extractedDataSelloutRepository.create(entityExtractedData);
        await this.extractionLogsSelloutRepository.create({
            selloutConfiguration: selloutConfiguration,
            startTime: startTime,
            endTime: endTime,
            status: status,
            recordsExtracted: recordCount,
            recordsProcessed: recordsProcessed,
            recordsFailed: recordsFailed,
            errorMessage: errorMessage,
            executionDetails: executionDetails
        });
        return plainToClass(ExtractedDataSelloutDto, { ...extractedData, productCount: productCount }, {
            excludeExtraneousValues: true,
        });
    }

    async updateExtractedDataSellout(id: number, selloutConfiguration: UpdateExtractedDataSelloutDto): Promise<ExtractedDataSellout> {
        const existingExtractedDataSellout = await this.extractedDataSelloutRepository.findById(id);

        if (!existingExtractedDataSellout) {
            throw new Error(`Extracted data sellout con ID ${id} no encontrado`);
        }

        existingExtractedDataSellout.selloutConfiguration = { id: selloutConfiguration.selloutConfigurationId } as SelloutConfiguration;
        existingExtractedDataSellout.extractionLogsSellout = { id: selloutConfiguration.extractionLogId } as ExtractionLogsSellout;
        existingExtractedDataSellout.dataContent = selloutConfiguration.dataContent;
        existingExtractedDataSellout.recordCount = selloutConfiguration.recordCount;
        existingExtractedDataSellout.isProcessed = selloutConfiguration.isProcessed;
        existingExtractedDataSellout.processedDate = selloutConfiguration.processedDate;
        existingExtractedDataSellout.processedBy = { id: selloutConfiguration.processedBy } as User;
        existingExtractedDataSellout.processingDetails = selloutConfiguration.processingDetails;
        existingExtractedDataSellout.dataName = selloutConfiguration.dataName;
        existingExtractedDataSellout.calculateDate = parseDateFromISO(selloutConfiguration.calculateDate!);
        existingExtractedDataSellout.createdBy = { id: selloutConfiguration.createdBy } as User;

        return this.extractedDataSelloutRepository.update(id, existingExtractedDataSellout);
    }

    async deleteExtractedDataSellout(id: number): Promise<void> {
        const existingExtractedDataSellout = await this.extractedDataSelloutRepository.findById(id);
        if (!existingExtractedDataSellout) {
            throw new Error(`Extracted data sellout con ID ${id} no encontrado`);
        }
        await this.extractedDataSelloutRepository.delete(id);
    }

    async getFilteredExtractedDataSellout(
        page: number,
        limit: number,
    ): Promise<ExtractedDataSelloutFiltersResponseDto> {
        const { items, total } = await this.extractedDataSelloutRepository.findPaginated(page, limit);
        return {
            items: plainToInstance(ExtractedDataSelloutDto, items, {
                excludeExtraneousValues: true,
            }),
            total,
        };
    }
}
