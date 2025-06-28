import { Contract, Context, Returns, Info, Transaction } from 'fabric-contract-api';

interface ICondicionesAlmacenamiento{
    temperatura: number,
    humedad: number,
}

interface IDatosSiembra{
    lugar: string,
    productor: string,
    fechaSiembra: Date,
    variedad: string,
    insumosUsados: string[],
    tratamientosAplicados: string[]
}


@Info({ title: 'LoteSemillasContrato', description: 'Contrato para manejar todas las transacciones relacionadas con el asset loteSemillas' })
export default class LoteSemillasContrato extends Contract {
    @Transaction()
    @Returns('string')
    public async AlmacenarLoteSemillas(ctx: Context, condiciones: ICondicionesAlmacenamiento): Promise<string> {
        return '';
    }

    @Transaction()
    @Returns('string')
    public async SembrarLoteSemillas(ctx: Context, datosSiembra: IDatosSiembra): Promise<string> {
        return ''
    }

    @Transaction()
    @Returns('string')
    public async LeerLoteSemillas(ctx: Context): Promise<string> {
        return ''
    }
}