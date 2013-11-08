var daggy = require('daggy'),
    Either = daggy.taggedSum({
        Left:  ['l'],
        Right: ['r']
    });

// Methods
Either.prototype.fold = function(f, g) {
    return this.cata({
        Left: f,
        Right: g
    });
};
Either.of = Either.Right;
Either.prototype.swap = function() {
    return this.fold(
        function(l) {
            return Either.Right(l);
        },
        function(r) {
            return Either.Left(r);
        }
    );
};
Either.prototype.bimap = function(f, g) {
    return this.fold(
        function(l) {
            return Either.Left(f(l));
        },
        function(r) {
            return Either.Right(g(r));
        }
    );
};
Either.prototype.chain = function(f) {
    return this.fold(
        function(l) {
            return Either.Left(l);
        },
        function(r) {
            return f(r);
        }
    );
};
Either.prototype.concat = function(b) {
    return this.fold(
        function(l) {
            return Either.Left(l);
        },
        function(r) {
            return b.chain(function(t) {
                return Either.Right(r.concat(t));
            });
        }
    );
};

// Derived
Either.prototype.map = function(f) {
    return this.chain(function(a) {
        return Either.of(f(a));
    });
};
Either.prototype.ap = function(a) {
    return this.chain(function(f) {
        return a.map(f);
    });
};

// Transformer
Either.EitherT = function(M) {
    var EitherT = daggy.tagged('run');
    EitherT.prototype.fold = function(f, g) {
        return this.run.chain(function(o) {
            return M.of(o.fold(f, g));
        });
    };
    EitherT.of = function(x) {
        return EitherT(M.of(Either.Right(x)));
    };
    EitherT.prototype.swap = function() {
        return this.fold(
            function(l) {
                return Either.Right(l);
            },
            function(r) {
                return Either.Left(r);
            }
        );
    };
    EitherT.prototype.bimap = function(f, g) {
        return this.fold(
            function(l) {
                return Either.Right(f(l));
            },
            function(r) {
                return Either.Left(g(r));
            }
        );
    };
    EitherT.prototype.chain = function(f) {
        var m = this.run;
        return EitherT(m.chain(function(o) {
            return o.fold(
                function(a) {
                    return M.of(Either.Left(a));
                },
                function() {
                    return f(a).run;
                }
            );
        }));
    };
    EitherT.prototype.map = function(f) {
        return this.chain(function(a) {
            return EitherT.of(f(a));
        });
    };
    EitherT.prototype.ap = function(a) {
        return this.chain(function(f) {
            return a.map(f);
        });
    };
    return EitherT;
};

// Export
if(typeof module != 'undefined')
    module.exports = Either;