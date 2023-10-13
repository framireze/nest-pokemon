import { Injectable } from '@nestjs/common';
import axios, {AxiosInstance} from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { PokemonService } from 'src/pokemon/pokemon.service';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  //Colocamos esta linea para ser claro que tenemos una dependencia axios, no es inyectado es solo una dependencia de nuestro servicio
  //private readonly axiosAPI: AxiosInstance = axios;
  
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly http: AxiosAdapter
  ){}


  async executeSeed(){    
    await this.pokemonService.deleteAll()
    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=1000')
    console.time('Tiempo de ejecucion');
    const pokemonToInsert:{name:string, no:number}[] = []
    //const pokemonToInsert = []
    data.results.forEach(({name, url}) => {
      const segments = url.split('/');
      const no = +segments[segments.length -2];
      //pokemonToInsert.push(this.pokemonService.create({no, name}))
      pokemonToInsert.push({no, name})
    })
    //const resultInsert = await Promise.all(pokemonToInsert)    // Otra forma es con inserMany
    await this.pokemonService.insertManyPokemons(pokemonToInsert)
    console.timeEnd('Tiempo de ejecucion');
    //console.log('Promesas',resultInsert.length);
    return data.results
  }
}
