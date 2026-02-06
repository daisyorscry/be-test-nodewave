import { INTERNAL_SERVER_ERROR_SERVICE_RESPONSE, ServiceResponse } from "$entities/Service";
import Logger from '$pkg/logger';

export async function get():Promise<ServiceResponse<{}>>{
    /** Example service placeholder */
    try{
        return {
            status:true,
            data:{}
        }
    }catch(err){
        Logger.error(`ExampleService.get : ${err}`)
        return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE
    }
}
