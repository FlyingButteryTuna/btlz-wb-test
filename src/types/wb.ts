export interface WbBoxTariffsResponse {
    response: {
        data: {
            dtNextBox: string;
            dtTillMax: string;
            warehouseList: Array<{
                boxDeliveryBase: string;
                boxDeliveryCoefExpr: string;
                boxDeliveryLiter: string;
                boxDeliveryMarketplaceBase: string;
                boxDeliveryMarketplaceCoefExpr: string;
                boxDeliveryMarketplaceLiter: string;
                boxStorageBase: string;
                boxStorageCoefExpr: string;
                boxStorageLiter: string;
                geoName: string;
                warehouseName: string;
            }>;
        };
    };
}
