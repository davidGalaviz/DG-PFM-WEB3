import { Object, Property } from "fabric-contract-api";
import { PaqueteFresas } from "./PaqueteFresas";

@Object()
export class PropietarioPaqueteFresasVariedad {
    @Property()
    public propietarioAddress: string = ''; // Metamask address
    @Property()
    public variedad: string = '';
    @Property()
    public paquetesFresas: PaqueteFresas[] = [];
}