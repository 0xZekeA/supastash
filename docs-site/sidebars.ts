import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
// const sidebars: SidebarsConfig = {
//   // By default, Docusaurus generates a sidebar from the docs folder structure
//   tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],

//   // But you can create a sidebar manually
//   /*
//   tutorialSidebar: [
//     'intro',
//     'hello',
//     {
//       type: 'category',
//       label: 'Tutorial',
//       items: ['tutorial-basics/create-a-document'],
//     },
//   ],
//    */
// };

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "doc",
      id: "getting-started",
      label: "Getting Started",
    },

    {
      type: "category",
      label: "Query Builder",
      items: ["supastash-query-builder", "run-executions"],
    },
    {
      type: "category",
      label: "CRUD Methods",
      items: [
        "insert-query",
        "select-query",
        "update-query",
        "delete-query",
        "upsert-query",
      ],
    },
    {
      type: "category",
      label: "Database Management",
      items: ["schema-management", "destructives", "sync-status-manager"],
    },
    {
      type: "doc",
      id: "useSupastash-hook",
      label: "useSupastash",
    },
    {
      type: "doc",
      id: "data-access",
      label: "useSupastashData",
    },
    {
      type: "doc",
      id: "configuration",
      label: "Configuration",
    },
    {
      type: "doc",
      id: "sync-flows",
      label: "Sync Flows",
    },
  ],
};
export default sidebars;
