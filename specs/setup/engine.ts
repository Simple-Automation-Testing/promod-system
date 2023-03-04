import { seleniumWD, playwrightWD } from 'promod';

const { $, $$, browser, getDriver } = process.env.ENGINE === 'pw' ? playwrightWD : seleniumWD;

export { $, $$, browser, getDriver };
