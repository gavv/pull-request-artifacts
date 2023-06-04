import {toMarkdown} from '../src/markdown'
import {expect, test} from '@jest/globals'

const testcases = [
  {
    name: 'text file should result in link',
    filename: 'test.txt',
    link: 'https://google.com',
    expectImage: false
  },
  {
    name: 'file with no extension should result in link',
    filename: 'test',
    link: 'https://google.com',
    expectImage: false
  },
  {
    name: 'png file should result in image',
    filename: 'test.png',
    link: 'https://google.com',
    expectImage: true
  },
  {
    name: 'jpeg file should result in image',
    filename: 'test.jpeg',
    link: 'https://google.com',
    expectImage: true
  },
  {
    name: 'jpg file should result in image',
    filename: 'test.jpg',
    link: 'https://google.com',
    expectImage: true
  },
  {
    name: 'svg file should result in image',
    filename: 'test.svg',
    link: 'https://google.com',
    expectImage: true
  }
]

testcases.forEach(testcase => {
  test(testcase.name, () => {
    const result = toMarkdown(testcase.filename, testcase.link)
    expect(result).toEqual(
      `${testcase.expectImage ? '!' : ''}[\`${testcase.filename}\`](${
        testcase.link
      })`
    )
  })
})
