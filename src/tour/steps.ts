import type { TourStep } from "@/types/tour";

export const mainTourSteps: TourStep[] = [
  {
    id: "welcome-details",
    tourId: "welcome-details-overlay",
    title: "Tell us about you",
    content: "Share a few details so we can tailor this tour and future demos to your firm.",
    placement: "bottom",
    route: "/",
  },
  {
    id: "homepage-overview",
    tourId: "homepage-overview-overlay",
    title: "Web App Homepage",
    content:
      "This is the homepage, where you can answer any RFP or DDQ question, and draft client communications.",
    placement: "right",
    route: "/",
  },
  {
    id: "vault-sidebar",
    tourId: "sidebar-vault-tab",
    title: "This is the Vault",
    content:
      "This is the Vault, where we store your RFP question/answer pairs with embeddings and tags. You can easily search, edit, and bulk tag Q/A pairs here.",
    placement: "right",
    route: "/vault?tab=qa",
  },
  {
    id: "vault-top-qa",
    tourId: "vault-top-qa",
    title: "Edit a Q/A pair",
    content:
      "Click any row to view, edit, or manage tags. You can search, filter, and export your prior RFP and DDQ content from here.",
    placement: "top",
    route: "/vault?tab=qa",
  },
  {
    id: "vault-search-filter",
    tourId: "vault-filter-panel",
    title: "Search and Filter bar",
    content:
      "It's easy to search, filter, sort, and export specific tagged content from your prior RFPs and DDQs.",
    placement: "bottom",
    route: "/vault?tab=qa",
  },
  {
    id: "add-content-page",
    tourId: "add-content-options",
    title: "Add Content page",
    content:
      "This page is where you upload 'prior art' into your Vault, including completed RFPs, DDQs, quarterly data files, insight docs, and writing samples.",
    placement: "left",
    route: "/vault/add-content",
  },
  {
    id: "homepage-trust-score",
    tourId: "homepage-trust-score",
    title: "Generated Answer and Trust Score",
    content:
      "Every answer to a question is returned with our patented Trust Score, which gives you confidence that the answer is sourced and generated from your compliance-approved language and in your firm's tone of voice",
    placement: "left",
    route: "/",
  },
  {
    id: "word-plugin-demo",
    tourId: "word-plugin-panel",
    title: "AdviserGPT Microsoft 365 Plug-in",
    content:
      "This is the AdviserGPT Plug-in view inside a Micrrosoft Word document workflow, where you can draft, improve, and search approved language alongside the document.",
    placement: "left",
    route: "/word-plugin-demo",
  },
  {
    id: "word-plugin-bulk-answer",
    tourId: "word-plugin-bulk-answer",
    title: "Bulk Answer in MSFT Word Plug-in",
    content:
      "Users can highlight many questions at a time, section by section or the entire document, and answer them at once automatically using your Vault. The Trust Score and answer sources are always displayed as comments in the margin as your answers are populated. We maintain your text, tables, and image formatting.",
    placement: "left",
    route: "/word-plugin-demo",
  },
  {
    id: "word-plugin-improve",
    tourId: "word-plugin-improve",
    title: "Improve in MSFT Word Plug-in",
    content:
      "Users can iterate and improve their answers generated, and save to the Vault if the user wants. Collaboration between coworkers and compliance teams is handled in MS Office documents via comments. All changes are tracked in our audit trail.",
    placement: "left",
    route: "/word-plugin-demo",
  },
  {
    id: "drafts-workspace",
    tourId: "drafts-agent-sidebar",
    title: "Drafts in the Web App",
    content:
      "Users can also leverage their Vault + the Web + one-time Informational Inputs to draft content that adheres to the outline and tone of an approved writing sample.",
    placement: "left",
    route: "/drafts",
  },
  {
    id: "drafts-completed",
    tourId: "drafts-completed",
    title: "Show completed Draft",
    content:
      "AdviserGPT enables users to draft client communications and commentary with their firm's tone of voice and compliance-approved language combined with quarterly client attribution and reporting data..",
    placement: "right",
    route: "/drafts",
  },
  {
    id: "book-demo",
    tourId: "book-demo-overlay",
    title: "Book a demo",
    content:
      "Ready to see AdviserGPT in action? Contact us and we'll reach out to schedule a personalized demo for your firm.",
    placement: "bottom",
    route: "/drafts",
  },
];
