import {expect, test} from 'vitest'
import * as regex from '../src/regex.js'

test("Walidacja Imienia", ()=>{
    expect("Oskar").toMatch(regex.validate_name)
    expect("Bogdan").toMatch(regex.validate_name)
})