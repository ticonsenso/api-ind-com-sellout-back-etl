import { Expose, Type } from "class-transformer";
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsBoolean,
} from "class-validator";

export class CreateProductSicDto {
    @IsNotEmpty({ message: "El código de la tienda es requerido" })
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    jdeCode!: string;

    @IsNotEmpty({ message: "El nombre de la tienda es requerido" })
    @IsString({ message: "El nombre de la tienda debe ser una cadena de texto" })
    jdeName!: string;

    @IsOptional()
    @IsString({ message: "El nombre de la tienda debe ser una cadena de texto" })
    imeName?: string;

    @IsOptional()
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    sapCode?: string;

    @IsOptional()
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    sapName?: string;

    @IsNotEmpty({ message: "El distribuidor es requerido" })
    @IsString({ message: "El distribuidor debe ser una cadena de texto" })
    companyLine!: string;

    @IsNotEmpty({ message: "El distribuidor SAP es requerido" })
    @IsString({ message: "El distribuidor SAP debe ser una cadena de texto" })
    category!: string;

    @IsNotEmpty({ message: "El canal de venta es requerido" })
    @IsString({ message: "El canal de venta debe ser una cadena de texto" })
    subCategory!: string;

    @IsNotEmpty({ message: "La región de venta es requerida" })
    @IsString({ message: "La región de venta debe ser una cadena de texto" })
    marModelLm!: string;

    @IsNotEmpty({ message: "La ciudad es requerida" })
    @IsString({ message: "La ciudad debe ser una cadena de texto" })
    designLine!: string;

    @IsNotEmpty({ message: "La región es requerida" })
    @IsString({ message: "La región debe ser una cadena de texto" })
    brand!: string;

    @IsNotEmpty({ message: "La categoría es requerida" })
    @IsString({ message: "La categoría debe ser una cadena de texto" })
    discontinued!: boolean;

    @IsOptional()
    @IsBoolean({ message: "El estado debe ser un booleano" })
    status?: boolean;

    @IsOptional()
    @IsString({ message: "El sheet visit debe ser una cadena de texto" })
    sheetVisit?: string | null;

    @IsOptional()
    @IsString({ message: "El equivalente debe ser una cadena de texto" })
    equivalentProId?: string | null;

    @IsNotEmpty({ message: "El equivalente es requerido" })
    @IsString({ message: "El equivalente debe ser una cadena de texto" })
    equivalent!: string;

    @IsOptional()
    @IsString({ message: "La vigencia debe ser una cadena de texto" })
    validity?: string;

    @IsOptional()
    @IsString({ message: "El repeated numbers debe ser una cadena de texto" })
    repeatedNumbers?: string | null;

    @IsNotEmpty({ message: "El ID del producto SIC es requerido" })
    @IsNumber({}, { message: "El ID del producto SIC debe ser un número" })
    idProductSic!: number;

}

export class UpdateProductSicDto {
    @IsNotEmpty({ message: "El código de la tienda es requerido" })
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    jdeCode!: string;

    @IsNotEmpty({ message: "El nombre de la tienda es requerido" })
    @IsString({ message: "El nombre de la tienda debe ser una cadena de texto" })
    jdeName!: string;

    @IsOptional()
    @IsString({ message: "El nombre de la tienda debe ser una cadena de texto" })
    imeName?: string;

    @IsOptional()
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    sapCode?: string;

    @IsOptional()
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    sapName?: string;

    @IsNotEmpty({ message: "El distribuidor es requerido" })
    @IsString({ message: "El distribuidor debe ser una cadena de texto" })
    companyLine!: string;

    @IsNotEmpty({ message: "El distribuidor SAP es requerido" })
    @IsString({ message: "El distribuidor SAP debe ser una cadena de texto" })
    category!: string;

    @IsNotEmpty({ message: "El canal de venta es requerido" })
    @IsString({ message: "El canal de venta debe ser una cadena de texto" })
    subCategory!: string;

    @IsNotEmpty({ message: "La región de venta es requerida" })
    @IsString({ message: "La región de venta debe ser una cadena de texto" })
    marModelLm!: string;

    @IsNotEmpty({ message: "La ciudad es requerida" })
    @IsString({ message: "La ciudad debe ser una cadena de texto" })
    designLine!: string;

    @IsNotEmpty({ message: "La región es requerida" })
    @IsString({ message: "La región debe ser una cadena de texto" })
    brand!: string;

    @IsNotEmpty({ message: "La categoría es requerida" })
    @IsString({ message: "La categoría debe ser una cadena de texto" })
    discontinued!: boolean;

    @IsOptional()
    @IsBoolean({ message: "El estado debe ser un booleano" })
    status?: boolean;

    @IsOptional()
    @IsString({ message: "El sheet visit debe ser una cadena de texto" })
    sheetVisit?: string | null;

    @IsOptional()
    @IsString({ message: "El equivalente debe ser una cadena de texto" })
    equivalentProId?: string | null;

    @IsNotEmpty({ message: "El equivalente es requerido" })
    @IsString({ message: "El equivalente debe ser una cadena de texto" })
    equivalent!: string;

    @IsOptional()
    @IsString({ message: "La vigencia debe ser una cadena de texto" })
    validity?: string;

    @IsOptional()
    @IsString({ message: "El repeated numbers debe ser una cadena de texto" })
    repeatedNumbers?: string | null;

    @IsNotEmpty({ message: "El ID del producto SIC es requerido" })
    @IsNumber({}, { message: "El ID del producto SIC debe ser un número" })
    idProductSic!: number;
}

export class ProductSicResponseDto {
    @Expose()
    id!: number;

    @Expose()
    idProductSic!: number | null;

    @Expose()
    jdeCode!: string;

    @Expose()
    jdeName!: string;

    @Expose()
    imeName!: string;

    @Expose()
    sapCode!: string;

    @Expose()
    sapName!: string;

    @Expose()
    companyLine!: string;

    @Expose()
    category!: string;

    @Expose()
    subCategory!: string;

    @Expose()
    marModelLm!: string;

    @Expose()
    designLine!: string;

    @Expose()
    brand!: string;

    @Expose()
    discontinued!: boolean;

    @Expose()
    status!: boolean;

    @Expose()
    sheetVisit!: string;

    @Expose()
    equivalentProId!: string;

    @Expose()
    equivalent!: string;

    @Expose()
    validity!: string | null;

    @Expose()
    repeatedNumbers!: string | null;
}

export class ProductSicResponsePptoDto {
    @Expose()
    companyLine!: string;

    @Expose()
    category!: string;

    @Expose()
    subCategory!: string;

    @Expose()
    model!: string | null;

    @Expose()
    equivalentProId!: string;

    @Expose()
    jdeName!: string;

    @Expose()
    brand!: string;
}

export class StoreSearchDto {
    @IsOptional()
    @IsNumber({}, { message: "El ID debe ser un número" })
    id?: number;

    @IsOptional()
    @IsString({ message: "El código de la tienda debe ser una cadena de texto" })
    jdeCode?: string;

    @IsOptional()
    @IsString({ message: "El nombre de la tienda debe ser una cadena de texto" })
    jdeName?: string;
}

export class ProductSicPaginatedResponseDto {
    @Expose()
    @Type(() => ProductSicResponseDto)
    items!: ProductSicResponseDto[];

    @Expose()
    total!: number;
}
