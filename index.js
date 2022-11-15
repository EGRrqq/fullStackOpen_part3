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

app.get('/info', (req, res) => {
    Person.find({}).then(persons => {
        res.send(`
            <p>Phonebook has info for ${persons.length} people</p>
            <p>${new Date()}</p>
        `)
    })
})

app.post('/api/persons', (req, res) => {
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
})

app.delete('/api/persons/:id', (req, res) => {
    Person.findByIdAndDelete(req.params.id)
        .then(person => {
            if (!person) {
                res.status(400).send(req.params.id + ' was not found')
            } else {
                res.status(204).send(`${person.name} was deleted.`)
            }
        })
})

app.get('/api/persons/:id', (req, res) => {
    Person.findById(req.params.id)
        .then(person => {
            if (person) {
                return res.json(person)
            }
        })
        .catch(error =>
            res.status(404).json(
                { error: error.message }
            )
        )
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})