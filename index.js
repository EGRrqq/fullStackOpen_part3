require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const Person = require('./ models/person')

const app = express()

app.get('/api/persons', (req, res) => {
    Person.find({}).then(persons => {
        res.json(persons)
    })
})

morgan.token('req-body', req => JSON.stringify(req.body))

app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'))
app.use(cors())
app.use(express.static('build'))

app.get('/api/persons', (req, res, next) => {
    Person.find({})
        .then((persons) => {
            res.status(200).json(persons)
        })
        .catch((error) => next(error))
})

app.get('/info', (req, res, next) => {
    Person.find({}).then(persons => {
        res.send(`
            <p>Phonebook has info for ${persons.length} people</p>
            <p>${new Date()}</p>
        `)
    })
        .catch((error) => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
        .then((person) => {
            res.status(200).json(person)
            if (person) {
                res.status(200).json(person)
            } else {
                res.status(404).end()
            }
        })
        .catch((error) => next(error))
})

app.post('/api/persons', (req, res, next) => {
    const { name, number } = req.body

    if (!name || !number) {
        const missing = !!name ? 'Number' : 'Name'
        return res.status(400).json({ error: `'${missing}' is missing` })
    }

    Person.findOne({ name: name })
        .then((person) => {
            if (person) {
                res
                    .status(400)
                    .json({ error: `${person.name} name must be unique` })
            } else {
                const person = new Person({
                    name: name,
                    number: number,
                })
                person.save().then((savedPerson) => res.json(savedPerson))
            }
        })
        .catch((error) => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndDelete(req.params.id)
        .then(person => {
            if (!person) {
                res.status(400).send(req.params.id + ' was not found')
            } else {
                res.status(204).send(`${person.name} was deleted.`)
            }
        })
        .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.log(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})