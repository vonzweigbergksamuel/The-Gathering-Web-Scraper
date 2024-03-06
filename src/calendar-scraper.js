/**
 * The calendar scraper of the application.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import { LinkCrawler } from './link-crawler.js'
import { UniversalScraper } from './universal-scraper.js'

/**
 *
 */
export class CalendarScraper {
  /**
   * Represents a CalendarScraper object.
   *
   * @class
   * @param {string} baseUrl - The base URL for the calendar scraper.
   */
  constructor (baseUrl) {
    this.baseUrl = baseUrl
  }

  /**
   * Displays calendar information by crawling through links and retrieving calendar info.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the calendar information is displayed.
   */
  async displayCalendarInfo () {
    const linkCrawler = new LinkCrawler(this.baseUrl)

    let links = await linkCrawler.crawl(this.baseUrl)

    links = links.filter(link => link.includes('.html'))

    const people = {}

    for (const link of links) {
      const calendarInfo = await this.#getCalendarInfo(link)
      const fileName = link.substring(link.lastIndexOf('/') + 1)
      const person = fileName.charAt(0).toUpperCase() + fileName.slice(1, fileName.lastIndexOf('.'))

      // Removes all numbers from the person's name (if there are any).
      people[person.replace(/[0-9]/g, '')] = calendarInfo
    }

    return people
  }

  /**
   * Retrieves calendar information from a given link.
   *
   * @async
   * @private
   * @param {string} link - The link to scrape the calendar information from.
   * @returns {Promise<Array<{day: string, info: string}>>} - A promise that resolves to an array of objects containing the day and corresponding information.
   */
  async #getCalendarInfo (link) {
    const htmlElement = 'td'
    const universalScraper = new UniversalScraper()

    const days = ['Friday', 'Saturday', 'Sunday']
    const html = await universalScraper.extractHtml(link, htmlElement)
    const tdElements = html.map(htmlElement => htmlElement.textContent)

    // Convert all td elements to lowercase.
    tdElements.forEach((element, index) => {
      tdElements[index] = element.toLowerCase()
    })

    // Create an array of objects containing the day and corresponding information.
    const calendarInfo = days.map((day, index) => ({
      day,
      info: tdElements[index]
    }))

    return calendarInfo
  }
}
