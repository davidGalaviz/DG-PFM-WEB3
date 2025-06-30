import { Contract, Context, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({ title: 'AdminContrato', description: 'Contrato para gestionar usarios, solo un admin lo puede ejecutar' })
export default class AdminContrato extends Contract {
    @Transaction()
    @Returns('string')
    public async RegistrarUsuario(ctx: Context): Promise<string> {
        return '';
    }  
    
    @Transaction()
    @Returns('string')
    public async EliminarUsuario(ctx: Context): Promise<string> {
        return '';
    }  
    
    @Transaction()
    @Returns('string')
    public async ConsultarUsuarios(ctx: Context): Promise<string> {
        return '';
    }
}