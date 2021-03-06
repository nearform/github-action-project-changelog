'use strict'
const { test } = require('tap')

const { filterByColumnIds, findColumnIdByName } = require('../src/filters')
const { formatCards } = require('../src/markdown')
const mockData = require('./mock')

const addCards = (cards = []) => {
  return {
    ...mockData,
    organization: {
      ...mockData.organization,
      projectNext: {
        ...mockData.organization.projectNext,
        items: {
          ...mockData.organization.projectNext.items,
          edges: [...mockData.organization.projectNext.items.edges, ...cards]
        }
      }
    }
  }
}

test('should filter cards by columnId', t => {
  t.plan(2)
  const card = {
    node: {
      content: null,
      fieldValues: {
        nodes: [
          {
            value: 'fake-column-id',
            projectField: {
              name: 'Status'
            }
          }
        ]
      }
    }
  }

  const organizationCards = addCards([card])
  const cards = organizationCards.organization.projectNext.items.edges
  const fCards = filterByColumnIds(cards, ['fake-column-id'])

  t.equal(fCards.length, 1)
  t.equal(fCards[0].node.fieldValues.nodes[0].value, 'fake-column-id')
})

test('should not filter cards when the its column id is different', t => {
  t.plan(1)
  const card = {
    node: {
      content: null,
      fieldValues: {
        nodes: [
          {
            value: 'another-status-id',
            projectField: {
              name: 'Status'
            }
          }
        ]
      }
    }
  }

  const organizationCards = addCards([card])
  const doneCards = filterByColumnIds(
    organizationCards.organization.projectNext.items.edges,
    ['fake-id']
  )

  t.equal(doneCards.length, 0)
})

test('should return empty cards when there is no cards to filter', t => {
  t.plan(1)
  const cards = filterByColumnIds()

  t.equal(cards.length, 0)
})

test('should format cards in markdown style using handlebar template', t => {
  t.plan(1)

  const organizationCards = addCards([
    {
      node: {
        title: 'fake-title-1',
        content: {
          url: 'fake-url-1',
          updatedAt: new Date('01-01-2022 12:00:00 AM'),
          closed: true,
          number: 5,
          assignees: {
            nodes: [
              {
                login: 'fake-login'
              }
            ]
          }
        }
      }
    },
    {
      node: {
        title: 'fake-title-2',
        content: {
          url: 'fake-url-2',
          updatedAt: new Date('01-01-2022 12:00:00 AM'),
          state: 'MERGED',
          number: 7,
          assignees: {
            nodes: [
              {
                login: 'fake-login-2'
              }
            ]
          }
        }
      }
    },
    {
      node: {
        title: 'fake-title-3',
        content: {
          url: 'fake-url-3',
          updatedAt: new Date('01-01-2022 12:00:00 AM'),
          state: 'MERGED',
          number: 15,
          assignees: {
            nodes: [
              {
                login: 'fake-login-3'
              }
            ]
          }
        }
      }
    }
  ])

  const fCards = formatCards(
    organizationCards.organization.projectNext.items.edges,
    '{{title}} {{url}}'
  )

  t.match(fCards, [
    'fake-title ',
    'fake-title-1 fake-url-1',
    'fake-title-2 fake-url-2',
    'fake-title-3 fake-url-3'
  ])
})

test('should return empty when there is no cards to format', t => {
  t.plan(1)

  const fCards = formatCards()

  t.equal(fCards.length, 0)
})

test('should call json2md with cards formated in markdown', t => {
  t.plan(1)
  const cards = [
    '**fake-title** [draft] ',
    '**[fake-title-1](fake-url-1)** [draft] updated at *1/1/2022, 12:00:00*',
    '**[fake-title-2](fake-url-2)** [merged] updated at *1/1/2022, 12:00:00*'
  ]

  const myModule = t.mock('../src/markdown', {
    json2md: input => {
      t.match(input, [
        { h1: "What's Changed" },
        {
          ul: cards
        }
      ])
    }
  })

  myModule.generateMarkdown(cards)
})

test('should find column id given project settings and column name', t => {
  t.plan(1)

  const projectSettings = [
    {
      name: 'Status',
      settings: '{"options": [{"id": "fake-id", "name": "fake-name"}]}'
    }
  ]

  const columnId = findColumnIdByName('fake-name', projectSettings)

  t.match(columnId, ['fake-id'])
})

test('should return undefined when column id is not found', t => {
  t.plan(1)

  const projectSettings = [
    {
      name: 'fake-settings-name',
      settings: '{"options": []}'
    }
  ]

  const columnId = findColumnIdByName('fake-column-name', projectSettings)

  t.equal(columnId, undefined)
})
