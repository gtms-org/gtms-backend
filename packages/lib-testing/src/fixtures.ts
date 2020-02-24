import { testDbHelper } from './TestDbHelper'
import Fixtures from 'node-mongodb-fixtures'

export async function loadFixtures() {
  const fixtures = new Fixtures({
    dir: `${process.cwd()}/fixtures`,
    mute: true,
  })

  await fixtures
    .connect(await testDbHelper.getConnectionString())
    .then(() => fixtures.load())
    .then(() => fixtures.disconnect())
}
