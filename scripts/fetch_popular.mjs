#!/usr/bin/env node
/**
 * 从 Cloudflare Web Analytics (RUM) 拉取热门页面与地区，生成 popular.json。
 * 需要环境变量：CF_API_TOKEN、CF_ACCOUNT_ID、CF_SITE_TAG
 * 缺任意一个则写空数据并正常退出（不阻塞 CI）。
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.CF_API_TOKEN;
const account = process.env.CF_ACCOUNT_ID;
const site = process.env.CF_SITE_TAG;

if(!token || !account || !site){
  writeFileSync(resolve(root, "popular.json"), JSON.stringify({ updated: null, pages: [], countries: [] }, null, 1));
  console.log("missing CF secrets — wrote empty popular.json");
  process.exit(0);
}

const end = new Date();
const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);

const query = `
query($accountTag: String!, $siteTag: String!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      pages: rumPageloadEventsAdaptiveGroups(
        limit: 20
        filter: { siteTag: $siteTag, datetime_geq: $start, datetime_leq: $end }
        orderBy: [count_DESC]
      ) {
        count
        dimensions { requestPath }
      }
      countries: rumPageloadEventsAdaptiveGroups(
        limit: 10
        filter: { siteTag: $siteTag, datetime_geq: $start, datetime_leq: $end }
        orderBy: [count_DESC]
      ) {
        count
        dimensions { countryName }
      }
    }
  }
}`;

const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: { "authorization": "Bearer " + token, "content-type": "application/json" },
  body: JSON.stringify({ query, variables: { accountTag: account, siteTag: site, start: start.toISOString(), end: end.toISOString() } })
});

const j = await r.json();
if(j.errors){
  console.error("graphql errors:", JSON.stringify(j.errors).slice(0, 500));
  process.exit(1);
}
const acc = j.data && j.data.viewer && j.data.viewer.accounts && j.data.viewer.accounts[0];
const pages = ((acc && acc.pages) || []).map(x => ({ path: x.dimensions.requestPath, views: x.count }));
const countries = ((acc && acc.countries) || []).map(x => ({ name: x.dimensions.countryName, views: x.count }));

writeFileSync(resolve(root, "popular.json"), JSON.stringify({ updated: new Date().toISOString(), pages, countries }, null, 1));
console.log("popular:", pages.length, "pages,", countries.length, "countries");
