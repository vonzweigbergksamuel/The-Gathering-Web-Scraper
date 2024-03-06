/**
 * The application module.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import { CalendarScraper } from './calendar-scraper.js'
import { CinemaScraper } from './cinema-scraper.js'
import { BarScraper } from './bar-scraper.js'

/**
 * Represents a web scraping application.
 */
export class Application {
  /**
   * The base URL for the application that is selected by the user, in the terminal.
   *
   * @type {string}
   */
  #baseUrl

  /**
   * The constructor of the class.
   *
   * @param {string} baseUrl - The base URL for the application that is selected by the user, in the terminal.
   */
  constructor (baseUrl) {
    this.#baseUrl = baseUrl
  }

  /**
   * Runs the application. Compiles the calendar availability of the different people, uses the calendar availability to see which movies are available and at what times, and makes a dinner reservation 2 hours after, based on the available movie tickets.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the application finishes running.
   */
  async run () {
    const compileCalendarAvailability = await this.#compileCalendarAvailability()
    // console.log(compileCalendarAvailability)

    const buyMovieTickets = await this.#buyMovieTickets(compileCalendarAvailability)
    // console.log(buyMovieTickets)

    const makeDinnerReservation = await this.#makeDinnerReservation(buyMovieTickets)

    console.log('Suggestions\n===========')
    for (const data of Object.keys(makeDinnerReservation)) {
      makeDinnerReservation[data].forEach(item => {
        const day = data.toString()
        const movie = item.movie
        const movieTime = item.movieTime
        const dinnerTime = item.dinnerTime
        console.log(`* On ${day}, "${movie}" begins at ${movieTime}:00, and there is a free table to book between ${dinnerTime}:00-${dinnerTime + 2}:00.`)
      })
    }
    return makeDinnerReservation
  }

  /**
   * Compiles the calendar availability of the different people.
   *
   * @async
   * @private
   * @returns {Promise<{}>} - A promise that resolves to an object containing the available days for each person.
   */
  async #compileCalendarAvailability () {
    const calendarScraper = new CalendarScraper(this.#baseUrl)
    const displayCalendarInfo = await calendarScraper.displayCalendarInfo()

    // Save the information of what day all people are available in the availableDays object.
    const people = Object.keys(displayCalendarInfo)
    const availableDays = {}

    // Loop through all people, create an array of the days each person is available (data.info = ok) and save it in the availableDays object.
    for (const person of people) {
      const personInfo = displayCalendarInfo[person]
      const availabilityArray = []
      for (const data of personInfo) {
        const day = data.day
        const availability = data.info
        if (availability === 'ok') {
          availabilityArray.push(day)
        }
      }
      availableDays[person] = availabilityArray
    }

    // Find the common days that all people are available by comparing the arrays in the availableDays object.
    const allDays = Object.values(availableDays)
    const commonDays = allDays[0].filter(day => allDays.every(otherDays => otherDays.includes(day)))

    return commonDays
  }

  /**
   * Uses the calendar availability to see which movies are available and at what times.
   *
   * @async
   * @private
   * @param {Array<string>} commonDays - An array of the days that all people are available.
   * @returns {Promise<{}>} - A promise that resolves to an object containing the available movies and their corresponding times.
   */
  async #buyMovieTickets (commonDays) {
    const cinemaScraper = new CinemaScraper(this.#baseUrl)
    const displayCinemaInfo = await cinemaScraper.displayCinemaInfo()

    const availableMovies = {}

    if (commonDays.length > 1) {
      commonDays.forEach(day => {
        const dayNumber = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          .indexOf(day) + 1 // Convert day strings to number values.

        const formattedDayNumber = dayNumber.toString().padStart(2, '0') // Add leading zero if necessary.

        const filteredArray = displayCinemaInfo.flat().filter(item => item.status === 1 && item.day === formattedDayNumber)

        availableMovies[day] = filteredArray
      })
    } else {
      const dayNumber = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        .indexOf(commonDays[0]) + 1 // Convert day strings to number values.

      const formattedDayNumber = dayNumber.toString().padStart(2, '0') // Add leading zero if necessary.

      const filteredArray = displayCinemaInfo.flat().filter(item => item.status === 1 && item.day === formattedDayNumber)

      availableMovies[commonDays[0]] = filteredArray
    }
    for (const day of Object.keys(availableMovies)) {
      const movies = availableMovies[day]
      const moviesText = movies.map(movie => ({
        time: String(movie.time.split(':')[0]), // Get hours from time
        // endingTime: String(movie.time.split(':')[1]), // Get minutes from time
        movie: movie.name
      }))
      availableMovies[day] = moviesText
    }

    return availableMovies
  }

  /**
   * Makes a dinner reservation based on the available movie tickets.
   *
   * @async
   * @private
   * @param {object} buyMovieTickets - Object containing movie tickets information.
   * @returns {object} - Object containing matching dinner times for each movie day.
   */
  async #makeDinnerReservation (buyMovieTickets) {
    const barScraper = new BarScraper(this.#baseUrl)
    const displayBarInfo = await barScraper.displayBarInfo()

    const availableDaysForDinner = {}

    // Loop through the available days for movies and find matching days for dinner.
    for (const movieDay of Object.keys(buyMovieTickets)) {
      for (const dinnerDay of Object.keys(displayBarInfo)) {
        if (movieDay === dinnerDay) {
          availableDaysForDinner[movieDay] = displayBarInfo[dinnerDay]
        }
      }
    }

    const matchingTimesForDinner = {}

    // Loop through the available days for dinner and find matching times for dinner and movie.
    for (const dinnerDay of Object.keys(availableDaysForDinner)) {
      const dinnerTimes = availableDaysForDinner[dinnerDay].map(dinner => parseInt(dinner.start)) // Convert dinner times to numbers
      const movieTimes = buyMovieTickets[dinnerDay].map(movie => parseInt(movie.time)) // Convert movie times to numbers

      // Find matching times for dinner and movie. Dinner must be at least 2 hours after the movie starts.
      const matchingDinnerTimes = dinnerTimes.filter(time => {
        return movieTimes.some(movieTime => time >= movieTime + 2)
      })

      // Create an object containing the movie, movie time and dinner time for each matching time.
      if (matchingDinnerTimes.length > 0) {
        matchingTimesForDinner[dinnerDay] = matchingDinnerTimes.flatMap(dinnerTime => {
          const matchingMovieTimesIndices = movieTimes.reduce((acc, movieTime, index) => {
            if (movieTime + 2 <= dinnerTime) acc.push(index)
            return acc
          }, [])

          return matchingMovieTimesIndices.map(index => ({
            movie: buyMovieTickets[dinnerDay][index].movie,
            movieTime: movieTimes[index],
            dinnerTime
          }))
        })
      } else {
        console.error('No matching times for dinner and movie')
      }
    }

    return matchingTimesForDinner
  }
}
