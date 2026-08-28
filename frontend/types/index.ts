export interface IProduct {
    id: string;
    productName: string;
    description: string;
    price: number;
    images: string[];

    brand: string;
    line: string;
    name: string;
    type: string;
    purpose: string;
    volume: string;
    hold: string;
    hairType?: string;
    texture?: string;
    effect: string;
    scent: string;
    countryOfBrand: string;
    form: string;
}

export type IProductCard = Pick<
    IProduct,
    "productName" | "price" | "images" | "type" | "id"
>;
