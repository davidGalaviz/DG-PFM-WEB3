import { Object, Property } from "fabric-contract-api";

@Object()
export class PropietarioPaqueteFresas {
    @Property()
    public propietario: string = '';
    @Property()
    public paquetesFresas: string[] = [];
}