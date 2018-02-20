import yenv from 'yenv'

export interface TestEnv {
  GCLOUD_PROJECT: string
  GCLOUD_CREDENTIALS: string
}

export function getEnv() {
  return yenv<TestEnv>('env.yaml', { optionalEntrypoint: true })
}
