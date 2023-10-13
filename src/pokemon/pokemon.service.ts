import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private defaultLimit:number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService,
  ){
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try{
      const pokemon = await this.pokemonModel.create(createPokemonDto)
      return pokemon;
    }catch(err){
      if(err.code === 11000) throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify(err.keyValue)}`)
      console.log(err);
    throw new InternalServerErrorException(`Can't create Pokemon- Check server logs`)
    }
    
  }

  async insertManyPokemons(createPokemonDtoArray: CreatePokemonDto[]) {
    try{
      const pokemon = await this.pokemonModel.insertMany(createPokemonDtoArray)
      return pokemon;
    }catch(err){
      if(err.code === 11000) throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify(err.keyValue)}`)
      console.log(err);
    throw new InternalServerErrorException(`Can't create Pokemon- Check server logs`)
    }
    
  }

  async findAll(queryParameters: PaginationDto) {
    const {limit = this.defaultLimit, offset = 0} = queryParameters;
    return await this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no: 1           //esto quiere decir que que ordene los arreglos por el campo "no" de manera ascendente
      })
      .select('-__v')     //retira el campo: __v   ==> este campo lo crea mongo
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    if ( !isNaN(+term) ) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // MongoID
    if ( !pokemon && isValidObjectId( term ) ) {
      pokemon = await this.pokemonModel.findById( term );
    }

    // Name
    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }


    if ( !pokemon ) 
      throw new NotFoundException(`Pokemon with id, name or no "${ term }" not found`);
    

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne( term );
    if ( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    
    try {
      await pokemon.updateOne( updatePokemonDto );
      return { ...pokemon.toJSON(), ...updatePokemonDto };
      
    } catch (error) {
      this.handleExceptions( error );
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();
    // return { id };
    // const result = await this.pokemonModel.findByIdAndDelete( id );

    const result = await this.pokemonModel.deleteOne({ _id: id });
    if ( result.deletedCount === 0 )
      throw new BadRequestException(`Pokemon with id "${ id }" not found`);

    return result;
  }

  async deleteAll(){
    const result = await this.pokemonModel.deleteMany({})
    return result
  }

  private handleExceptions( error: any ) {
    if ( error.code === 11000 ) {
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify( error.keyValue ) }`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
