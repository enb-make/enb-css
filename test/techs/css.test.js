var EOL = require('os').EOL,
    fs = require('fs'),
    mockFs = require('mock-fs'),
    loadDirSync = require('mock-enb/utils/dir-utils').loadDirSync,
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    CSSTech = require('../../techs/css');

describe('css', function () {
    afterEach(function () {
        mockFs.restore();
    });

    it('should throw syntax error', function () {
        var sources = {
            'block.css': '{'
        };

        return build(sources)
            .should.be.rejectedWith(/Unclosed block/);
    });

    it('should concat several files', function () {
        var sources = {
                'bar.css': '.bar {}',
                'baz.css': '.baz {}'
            };

        return build(sources).should.become([
            '.bar {}',
            '.baz {}'
        ].join(EOL));
    });

    describe('sourcemap', function () {
        it('should save sourcemap file', function () {
            var sources = {
                'foo.css': '.foo {}'
            };

            return build(sources, { sourcemap: true })
                .should.be.fulfilled
                .then(function () {
                    fs.existsSync('./bundle/bundle.css.map').should.be.true;
                });
        });

        it('should add annotation to sourcemap file', function () {
            var sources = {
                'foo.css': '.foo {}'
            };

            return build(sources, { sourcemap: true })
                .should.eventually.include('/*# sourceMappingURL=bundle.css.map */');
        });

        it('should inline sourcemap', function () {
            var sources = {
                'foo.css': '.foo {}'
            };

            return build(sources, { sourcemap: 'inline' })
                .should.eventually.include('/*# sourceMappingURL=data:application/json;base64');
        });
    });
});

function build(sources, opts) {
    mockFs({
        sources: sources,
        bundle: {}
    });

    var bundle = new MockNode('bundle'),
        fileList = new FileList();

    fileList.addFiles(loadDirSync('sources'));
    bundle.provideTechData('?.files', fileList);

    return bundle.runTechAndGetContent(CSSTech, opts)
        .spread(function (res) {
            return res;
        });
}
