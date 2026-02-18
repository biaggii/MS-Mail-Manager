export type ExportMode = "full" | "email-only"

export type Email = {
  email: string
  password: string
  client_id: string
  refresh_token: string
  tab: string
  remark: string
  tags: string[]
}

export type Post = {
  send: string
  subject: string
  text: string
  html: string
  date: string
}

export type TagContextMenuState = {
  x: number
  y: number
  rowEmail: string | null
  tag: string
  source: "filter" | "row"
}
