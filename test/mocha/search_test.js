suite('search', function () {
  setup(function () {
    var documents = [{
      id: 'a',
      title: 'Mr. Green kills Colonel Mustard',
      body: 'Mr. Green killed Colonel Mustard in the study with the candlestick. Mr. Green is not a very nice fellow.',
      wordCount: 19
    },{
      id: 'b',
      title: 'Plumb waters plant',
      body: 'Professor Plumb has a green plant in his study',
      wordCount: 9
    },{
      id: 'c',
      title: 'Scarlett helps Professor',
      body: 'Miss Scarlett watered Professor Plumbs green plant while he was away from his office last week.',
      wordCount: 16
    }]

    this.idx = lunr(function () {
      this.ref('id')
      this.field('title')
      this.field('body')

      documents.forEach(function (document) {
        this.add(document)
      }, this)
    })
  })

  suite('single term search', function () {
    suite('one match', function () {
      setup(function () {
        this.results = this.idx.search('scarlett')
      })

      test('one result returned', function () {
        assert.lengthOf(this.results, 1)
      })

      test('document c matches', function () {
        assert.equal('c', this.results[0].ref)
      })

      test('matching term', function () {
        assert.sameMembers(['scarlett'], this.results[0].matchData.terms)
      })
    })

    suite('no match', function () {
      setup(function () {
        this.results = this.idx.search('foo')
      })

      test('no matches', function () {
        assert.lengthOf(this.results, 0)
      })
    })

    suite('multiple matches', function () {
      setup(function () {
        this.results = this.idx.search('plant')
      })

      test('has two matches', function () {
        assert.lengthOf(this.results, 2)
      })

      test('sorted by relevance', function () {
        assert.equal('b', this.results[0].ref)
        assert.equal('c', this.results[1].ref)
      })
    })
  })

  suite('multiple terms', function () {
    suite('all terms match', function () {
      setup(function () {
        this.results = this.idx.search('fellow candlestick')
      })

      test('has one match', function () {
        assert.lengthOf(this.results, 1)
      })

      test('correct document returned', function () {
        assert.equal('a', this.results[0].ref)
      })

      test('matched terms returned', function () {
        assert.sameMembers(['fellow', 'candlestick'], this.results[0].matchData.terms)
      })
    })

    suite('one term matches', function () {
      setup(function () {
        this.results = this.idx.search('week foo')
      })

      test('has one match', function () {
        assert.lengthOf(this.results, 1)
      })

      test('correct document returned', function () {
        assert.equal('c', this.results[0].ref)
      })

      test('only matching terms returned', function () {
        assert.sameMembers(['week'], this.results[0].matchData.terms)
      })
    })

    suite('documents with all terms score higher', function () {
      setup(function () {
        this.results = this.idx.search('candlestick green')
      })

      test('has three matches', function () {
        assert.lengthOf(this.results, 3)
      })

      test('correct documents returned', function () {
        var matchingDocuments = this.results.map(function (r) {
          return r.ref
        })
        assert.sameMembers(['a', 'b', 'c'], matchingDocuments)
      })

      test('documents with all terms score highest', function () {
        assert.equal('a', this.results[0].ref)
      })

      test('matching terms are returned', function () {
        assert.sameMembers(['candlestick', 'green'], this.results[0].matchData.terms)
        assert.sameMembers(['green'], this.results[1].matchData.terms)
        assert.sameMembers(['green'], this.results[2].matchData.terms)
      })
    })

    suite('no terms match', function () {
      setup(function () {
        this.results = this.idx.search('foo bar')
      })

      test('no matches', function () {
        assert.lengthOf(this.results, 0)
      })
    })

    suite('corpus terms are stemmed', function () {
      setup(function () {
        this.results = this.idx.search('water')
      })

      test('matches two documents', function () {
        assert.lengthOf(this.results, 2)
      })

      test('matches correct documents', function () {
        var matchingDocuments = this.results.map(function (r) {
          return r.ref
        })
        assert.sameMembers(['b', 'c'], matchingDocuments)
      })
    })

    suite('field scoped terms', function () {
      suite('only matches on scoped field', function () {
        setup(function () {
          this.results = this.idx.search('title:plant')
        })

        test('one result returned', function () {
          assert.lengthOf(this.results, 1)
        })

        test('returns the correct document', function () {
          assert.equal('b', this.results[0].ref)
        })

        test('match data', function () {
          assert.sameMembers(['plant'], this.results[0].matchData.terms)
        })
      })

      suite('no matching terms', function () {
        setup(function () {
          this.results = this.idx.search('title:candlestick')
        })

        test('no results returned', function () {
          assert.lengthOf(this.results, 0)
        })
      })
    })

    suite('wildcard matching', function () {
      suite('trailing wildcard', function () {
        suite('no matches', function () {
          setup(function () {
            this.results = this.idx.search('fo*')
          })

          test('no results returned', function () {
            assert.lengthOf(this.results, 0)
          })
        })

        suite('one match', function () {
          setup(function () {
            this.results = this.idx.search('candle*')
          })

          test('one result returned', function () {
            assert.lengthOf(this.results, 1)
          })

          test('correct document matched', function () {
            assert.equal('a', this.results[0].ref)
          })

          test('matching terms returned', function () {
            assert.sameMembers(['candlestick'], this.results[0].matchData.terms)
          })
        })

        suite('multiple terms match', function () {
          setup(function () {
            this.results = this.idx.search('pl*')
          })

          test('two results returned', function () {
            assert.lengthOf(this.results, 2)
          })

          test('correct documents matched', function () {
            var matchingDocuments = this.results.map(function (r) {
              return r.ref
            })
            assert.sameMembers(['b', 'c'], matchingDocuments)
          })

          test('matching terms returned', function () {
            assert.sameMembers(['plumb', 'plant'], this.results[0].matchData.terms)
            assert.sameMembers(['plumb', 'plant'], this.results[1].matchData.terms)
          })
        })
      })
    })
  })

  suite('wildcard matching', function () {
    suite('trailing wildcard', function () {
      suite('no matches found', function () {
        setup(function () {
          this.results = this.idx.search('fo*')
        })

        test('no results returned', function () {
          assert.lengthOf(this.results, 0)
        })
      })

      suite('results found', function () {
        setup(function () {
          this.results = this.idx.search('pl*')
        })

        test('two results returned', function () {
          assert.lengthOf(this.results, 2)
        })

        test('matching documents returned', function () {
          assert.equal('b', this.results[0].ref)
          assert.equal('c', this.results[1].ref)
        })

        test('matching terms returned', function () {
          assert.sameMembers(['plant', 'plumb'], this.results[0].matchData.terms)
          assert.sameMembers(['plant', 'plumb'], this.results[1].matchData.terms)
        })
      })
    })

    suite('leading wildcard', function () {
      suite('no results found', function () {
        setup(function () {
          this.results = this.idx.search('*oo')
        })

        test('no results found', function () {
          assert.lengthOf(this.results, 0)
        })
      })

      suite('results found', function () {
        setup(function () {
          this.results = this.idx.search('*ant')
        })

        test('two results found', function () {
          assert.lengthOf(this.results, 2)
        })

        test('matching documents returned', function () {
          assert.equal('b', this.results[0].ref)
          assert.equal('c', this.results[1].ref)
        })

        test('matching terms returned', function () {
          assert.sameMembers(['plant'], this.results[0].matchData.terms)
          assert.sameMembers(['plant'], this.results[1].matchData.terms)
        })
      })
    })

    suite('contained wildcard', function () {
      suite('no results found', function () {
        setup(function () {
          this.results = this.idx.search('f*o')
        })

        test('no results found', function () {
          assert.lengthOf(this.results, 0)
        })
      })

      suite('results found', function () {
        setup(function () {
          this.results = this.idx.search('pl*nt')
        })

        test('two results found', function () {
          assert.lengthOf(this.results, 2)
        })

        test('matching documents returned', function () {
          assert.equal('b', this.results[0].ref)
          assert.equal('c', this.results[1].ref)
        })

        test('matching terms returned', function () {
          assert.sameMembers(['plant'], this.results[0].matchData.terms)
          assert.sameMembers(['plant'], this.results[1].matchData.terms)
        })
      })
    })
  })

  suite('edit distance', function () {
    suite('no results found', function () {
      setup(function () {
        this.results = this.idx.search('foo~1')
      })

      test('no results returned', function () {
        assert.lengthOf(this.results, 0)
      })
    })

    suite('results found', function () {
      setup(function () {
        this.results = this.idx.search('plont~1')
      })

      test('two results found', function () {
        assert.lengthOf(this.results, 2)
      })

      test('matching documents returned', function () {
        assert.equal('b', this.results[0].ref)
        assert.equal('c', this.results[1].ref)
      })

      test('matching terms returned', function () {
        assert.sameMembers(['plant'], this.results[0].matchData.terms)
        assert.sameMembers(['plant'], this.results[1].matchData.terms)
      })
    })
  })

  suite('searching by field', function () {
    suite('unknown field', function () {
      test('throws lunr.QueryParseError', function () {
        assert.throws(function () {
          this.idx.search('unknown-field:plant')
        }.bind(this), lunr.QueryParseError)
      })
    })

    suite('no results found', function () {
      setup(function () {
        this.results = this.idx.search('title:candlestick')
      })

      test('no results found', function () {
        assert.lengthOf(this.results, 0)
      })
    })

    suite('results found', function () {
      setup(function () {
        this.results = this.idx.search('title:plant')
      })

      test('one results found', function () {
        assert.lengthOf(this.results, 1)
      })

      test('matching documents returned', function () {
        assert.equal('b', this.results[0].ref)
      })

      test('matching terms returned', function () {
        assert.sameMembers(['plant'], this.results[0].matchData.terms)
      })
    })
  })

  suite('term boosts', function () {
    suite('no results found', function () {
      setup(function () {
        this.results = this.idx.search('foo^10')
      })

      test('no results found', function () {
        assert.lengthOf(this.results, 0)
      })
    })

    suite('results found', function () {
      setup(function () {
        this.results = this.idx.search('scarlett candlestick^5')
      })

      test('two results found', function () {
        assert.lengthOf(this.results, 2)
      })

      test('matching documents returned', function () {
        assert.equal('a', this.results[0].ref)
        assert.equal('c', this.results[1].ref)
      })

      test('matching terms returned', function () {
        assert.sameMembers(['candlestick'], this.results[0].matchData.terms)
        assert.sameMembers(['scarlett'], this.results[1].matchData.terms)
      })
    })
  })
})