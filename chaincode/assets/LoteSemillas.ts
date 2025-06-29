import { Object, Property } from "fabric-contract-api";

export interface ICondicionesAlmacenamiento{
    temperatura: number,
    humedad: number,
}

export interface ICondicionesSiembra{
    lugar: string,
    fechaSiembra: string,
    insumosUsados: string[],
    tratamientosAplicados: string[]
}

@Object()
export class LoteSemillas {
    @Property()
    public agricultor: string = '';
    @Property()
    public lote: string = '';
    @Property()
    public variedad: string = '';
    @Property()
    public toneladas: number = 0;
    @Property()
    public fechaCompra: string = new Date().toISOString();
    @Property()
    public estado: "almacenado" | "sembrado" = "almacenado";
    @Property()
    public condicionesAlmacenamiento?: ICondicionesAlmacenamiento;
    @Property()
    public condicionesSiembra?: ICondicionesSiembra;
}