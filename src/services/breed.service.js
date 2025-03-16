const Breed = require('../models/breed.model')

class BreedService {
  createBreed = async (name, description, image) => {
    const breed = await Breed.create({ name, description, image })
    return breed
  }
  getBreeds = async () => {
    const breeds = await Breed.find()
    return breeds
  }

  getBreedById = async (id) => {
    const breed = await Breed.findById(id)
    return breed
  }
}

module.exports = new BreedService()
