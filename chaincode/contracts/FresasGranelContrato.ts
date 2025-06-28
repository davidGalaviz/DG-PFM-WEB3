import { Contract, Context, Info, Transaction, Returns } from 'fabric-contract-api';

interface IDatosCosecha {
    fechaCosecha: Date,
    responsableCosecha: string,
    condicionesRecoleccion: string,
    tempDuranteCosecha: number,
    loteSemillas: string, 
}

@Info({ title: 'FresasGranelContrato', description: 'Este contrato contiene todas las transacciones relacionadas con el asset Fresas' })
export default class FresasGranelContrato extends Contract {
    @Transaction()
    @Returns('string')
    public async CosecharFresas(ctx: Context, datosCosecha: IDatosCosecha): Promise<string> {
        return '';
    }

    @Transaction()
    @Returns('string')
    public async LeerFresas(ctx: Context, ): Promise<string> {
        return '';
    }
}