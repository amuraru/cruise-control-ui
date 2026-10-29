<p align="center">
  <img height='100px' alt="Cruise Control Frontend" src="images/cc-logo.png">
</p>

Introduction
============

Frontend for Kafka Cruise Control. Provides a central dashboard to manage all Kafka deployments in an organization.

These are some of the features of the application:

1. Kafka Cluster Status
2. Kafka Cluster Load
3. Kafka Partition Load
4. Cruise Control State
5. Cruise Control Tasks
6. Kafka Cluster Administration
7. Cruise Control Proposals
8. Cruise Control Tasks
9. Preferences

In addition to these there is support for these common features

1. Running actions in Dry Run (Safe Mode) by default.
2. All Cruise Control REST API parameters are exposed as Input controls.
3. Safe Default values are provided to execute the actions as fast as possible.
4. Understand the Async Response from Cruise Control and render the progress.
5. Display URLs of the End points for every action.
6. Display Full Stack Trace responses from Cruise Control instead of shorter ones.
7. Customizable Look & Feel via theming

Documentation
=============

Application Screnshots & How-to Guides are available in the [wiki](https://github.com/linkedin/cruise-control-ui/wiki).

Development
===========

Use Node.js 26 (see `.nvmrc`) and the npm version pinned in `package.json` under
`engines.npm`. Renovate tracks this version; CI and Docker read the same pin.

```bash
npm install --global "npm@$(node -p 'require("./package.json").engines.npm')" --no-audit --no-fund
npm ci --no-audit --no-fund
npm test
npm run lint
npm run build
```

The production output remains `dist/`, including `dist/static/config.csv`.
Configure that CSV with the existing Cruise Control API prefix (for example,
`/kafkacruisecontrol`). The compatibility tests cover API URL construction and
both nested and legacy asynchronous progress responses.

The application uses Vue 3, Vue Router 5, Vuex 4, and Chart.js 4 with
vue-chartjs 5. The Options API, Bootstrap 5 styling, hash-based routes, and
Cruise Control API contracts are retained. Internet Explorer is not supported.

Run `npm run dev` to start Vite on port 8090 (`PORT` overrides the port).
Requests to `/kafkacruisecontrol` are proxied to `http://localhost:9090`.
Production assets use relative URLs so the built UI can also be hosted under
a subdirectory.

Browser regression tests run against the production build, served under `/ui/`,
with mocked Cruise Control responses. They cover deep links, cluster switching,
asynchronous task refresh, dry-run defaults, and real chart rendering and updates:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

These tests do not replace acceptance testing against your Cruise Control deployment.

License
=======

Released under [BSD 2-CLAUSE LICENSE](LICENSE.md) File.

Contributions
=============

Contributions are welcome as per [this document](CONTRIBUTING.md).
