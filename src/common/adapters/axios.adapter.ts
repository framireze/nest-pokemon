import axios, { AxiosInstance } from "axios";
import { HttpAdapter } from "../interfaces/http-adapter.interface";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AxiosAdapter implements HttpAdapter{
    //Colocamos esta linea para ser claro que tenemos una dependencia axios, no es inyectado es solo una dependencia de nuestro servicio
    private axiosAPI: AxiosInstance = axios;
    async get<T>(url: string): Promise<T> {
        try{
            const { data } = await this.axiosAPI.get<T>(url);
            return data;
        }catch(error){
            throw new Error('This is a error - Check logs');
        }
    }

}