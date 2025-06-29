import { Contract, Context, Returns, Info, Transaction } from 'fabric-contract-api';
import { ICondicionesSiembra, LoteSemillas } from '../assets/LoteSemillas';
import { ICondicionesAlmacenamiento } from '../assets/LoteSemillas';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';

@Info({ title: 'LoteSemillasContrato', description: 'Contrato para manejar todas las transacciones relacionadas con el asset loteSemillas' })
export default class LoteSemillasContrato extends Contract {
    
    // Transacción para almacenar un nuevo lote de semillas
    // Esta transacción crea un nuevo asset LoteSemillas con los parámetros recibidos y lo garda eb el WorldState.
    @Transaction()
    @Returns('string')
    public async AlmacenarLoteSemillas(ctx: Context, lote:string, agricultor:string, variedad:string, fechaCompra:string, toneladas: number,  condicionesAlmacenamiento:ICondicionesAlmacenamiento): Promise<LoteSemillas> {
        // Verificar que los parámetros sean validos
        // Verificamos que los parámetros no sean strings vacias o string con espacios en blanco
        // Verificamos que las toneladas sean un número positivo mayoar a 0
        if (lote.trim() === '') {
            throw new Error('El lote no puede ser un string vacío o con espacios en blanco.');
        }
        if (agricultor.trim() === '') {
            throw new Error('El agricultor no puede ser un string vacío o con espacios en blanco.');
        }
        if (variedad.trim() === ''){
            throw new Error('La variedad no puede ser un string vacío o con espacios en blanco.');
        }
        if (fechaCompra.trim() === '') {
            throw new Error('La fecha de compra no puede ser un string vacío o con espacios en blanco.');
        }
        if (toneladas <= 0){
            throw new Error('Las toneladas deben ser un número positivo mayor a 0.');
        }
        // Verificamos que el agricultor exista en el WorldState
        // TODO

        // Contruimos el key del asset con los parámetros recibidos
        // Nota: El Key es una cadena única que identifica el asset en el WorldState.
        const id = ctx.stub.createCompositeKey('LoteSemillas', [lote, variedad, fechaCompra, agricultor]);
        const exists = await this.LoteSemillasExists(ctx, id);
        if (exists) {
            throw new Error(`El asset ${id} ya exíste.`)
        }

        const loteSemillasAsset:LoteSemillas = {
            lote: lote,
            agricultor: agricultor,
            variedad: variedad,
            toneladas: toneladas,
            fechaCompra: fechaCompra,
            estado: 'almacenado',
            condicionesAlmacenamiento: condicionesAlmacenamiento,
        }

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(loteSemillasAsset))));
        return loteSemillasAsset;
    }


    @Transaction()
    @Returns('string')
    public async SembrarLoteSemillas(ctx: Context, id:string, condicionesSiembra: ICondicionesSiembra): Promise<LoteSemillas> {
        const exists = await this.LoteSemillasExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const loteSemillas:LoteSemillas = await ctx.stub.getState(id).then((data) => {
            return JSON.parse(data.toString())
        });
        if (loteSemillas.estado !== 'almacenado') {
            throw new Error(`El asset ${id} ya fue sembrado.`);
        }
        const { condicionesAlmacenamiento, estado, ...restLoteSemillas } = loteSemillas;
        const estadoNuevo: 'almacenado' | 'sembrado' = 'sembrado';
        const updatedLoteSemillas = {
            ...restLoteSemillas,
            estado: estadoNuevo,
            condicionesSiembra: condicionesSiembra
        }
        // Guardar el asset actualizado en el world state
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedLoteSemillas))))
        return updatedLoteSemillas;
    }

    @Transaction()
    @Returns('string')
    public async LeerLoteSemillas(ctx: Context, id: string): Promise<string> {
        // Verificar que existe un asset LoteSemillas con el id especificado
        const exist = await this.LoteSemillasExists(ctx, id);
        if (!exist) {
            throw new Error(`El asset ${id} no exíste.`);
        }
        // Devolver el asset LoteSemillas en formato JSON
        // Convertimos el buffer a string para que sea legible
        return (await ctx.stub.getState(id)).toString();
    }

    // LoteSemillasExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async LoteSemillasExists(ctx: Context, id: string): Promise<boolean> {
        if (id.split(":")[0] !== "LoteSemillas"){
            throw new Error("El asset que buscas no es un LoteSemillas.");
        }
        const loteSemillasJSON = await ctx.stub.getState(id);
        return loteSemillasJSON.length > 0;
    }
}