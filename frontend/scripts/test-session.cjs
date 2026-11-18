const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const token = (seconds) =>
    `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64')}.signature`;
function harness({
    native = true,
    accessToken = token(-1),
    sessionFetch,
} = {}) {
    let session = {
        user: {
            id: 'medic',
            username: 'medic',
            role: 'army_medical_officer',
            clearanceLevel: 1,
        },
        tokens: { accessToken, refreshToken: 'refresh' },
    };
    const state = {
        user: null,
        accessToken: null,
        setAuth(user, value) {
            this.user = user;
            this.accessToken = value;
        },
        clearAuth() {
            this.user = null;
            this.accessToken = null;
        },
    };
    let requests = 0;
    let signedOut = 0;
    const source = ts.transpileModule(
        fs.readFileSync(require.resolve('../lib/session.ts'), 'utf8'),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2021,
            },
        },
    ).outputText;
    const exports = {};
    vm.runInNewContext(source, {
        exports,
        process: { env: {} },
        atob,
        Headers,
        Error,
        fetch: async () => {
            requests++;
            return sessionFetch
                ? sessionFetch()
                : new Response(
                      JSON.stringify({
                          accessToken: token(900),
                          refreshToken: 'new-refresh',
                      }),
                  );
        },
        require(name) {
            if (name === 'next-auth/react')
                return {
                    getSession: async () => ({
                        user: session.user,
                        accessToken: token(900),
                    }),
                    signOut: async () => {
                        signedOut++;
                    },
                };
            if (name === './mobile-auth')
                return {
                    isMobileBuild: () => native,
                    getStoredSession: () => session,
                    storeSession: (value) => {
                        session = value;
                    },
                    clearSession: () => {
                        session = null;
                    },
                };
            if (name === './store/auth')
                return { useAuthStore: { getState: () => state } };
            throw Error(name);
        },
    });
    return {
        api: exports,
        state,
        requests: () => requests,
        session: () => session,
    };
}
test('native login hydrates the shared account before returning a fresh token', async () => {
    const h = harness({ accessToken: token(900) });
    assert.ok(await h.api.getAuthToken());
    assert.equal(h.state.user.id, 'medic');
    assert.equal(h.requests(), 0);
});
test('concurrent native refreshes issue only one request and store rotated tokens', async () => {
    const h = harness();
    const results = await Promise.all([
        h.api.getAuthToken(),
        h.api.getAuthToken(),
        h.api.getAuthToken(),
    ]);
    assert.equal(h.requests(), 1);
    assert.equal(new Set(results).size, 1);
    assert.equal(h.session().tokens.refreshToken, 'new-refresh');
});
test('logout during refresh cannot restore a signed-out account', async () => {
    let release;
    const h = harness({
        sessionFetch: () =>
            new Promise((resolve) => {
                release = resolve;
            }),
    });
    const pending = h.api.getAuthToken();
    h.api.clearClientSession();
    release(
        new Response(
            JSON.stringify({
                accessToken: token(900),
                refreshToken: 'rotated',
            }),
        ),
    );
    assert.equal(await pending, null);
    assert.equal(h.state.user, null);
    assert.equal(h.session(), null);
});
test('rejected refresh clears every native session store', async () => {
    const h = harness({
        sessionFetch: () => new Response('{}', { status: 401 }),
    });
    assert.equal(await h.api.getAuthToken(), null);
    assert.equal(h.session(), null);
    assert.equal(h.state.user, null);
});
test('web sessions refresh through NextAuth without exposing a refresh token', async () => {
    const h = harness({ native: false });
    assert.ok(await h.api.getAuthToken());
    assert.equal(h.requests(), 0);
});
