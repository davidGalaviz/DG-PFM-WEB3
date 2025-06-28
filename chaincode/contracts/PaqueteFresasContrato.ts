import { Contract, Context, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({ title: 'PaqueteFresasContrato', description: 'Este contrato contiene todas las transacciones relacionadas con el asset PaqueteFresas' })
export default class PaqueteFresasContrato extends Contract {
    @Transaction()
    @Returns('string')
    public async EmpacarFresas(ctx: Context): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async VentaMayoreoPaqueteFresas(ctx: Context): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async RecolectarPaqueteFresasDeAgricultor(ctx: Context): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async TransportarPaqueteFresasDistribuidor(ctx: Context): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async RecolectarPaqueteFresasDeDistribuidor(ctx: Context): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async TransportarPaqueteFresasMinorista(ctx: Context): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async LeerPaqueteFresas(ctx: Context): Promise<string> {
        return ''
    }
}