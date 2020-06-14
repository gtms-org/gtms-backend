import { consul } from './consul'
import logger from '@gtms/lib-logger'
import { randomInt, RoundRobinEngine } from '@gtms/commons'

export interface INode {
  Node: string
  Address: string
  ServiceID: string
  ServiceName: string
  ServiceTags: string[]
  ServicePort: number
}

const REFRESH_INTERVAL = 10000 // 10s

export class ConsulServices {
  private services: {
    [service: string]: RoundRobinEngine | null
  }

  private refreshInterval: NodeJS.Timeout

  constructor(private servicesList: string[]) {
    this.services = servicesList.reduce(
      (all: { [service: string]: null }, service) => {
        all[service] = null

        return all
      },
      {}
    )

    this.fetchAllNodes()

    setTimeout(() => {
      this.refreshInterval = setInterval(this.fetchAllNodes, REFRESH_INTERVAL)
    }, randomInt(0, 5000))
  }

  private fetchNodes = (service: string) => {
    return new Promise((resolve, reject) => {
      consul.catalog.service.nodes(
        {
          service,
        },
        (err, result) => {
          if (err) {
            logger.log({
              level: 'error',
              message: `Can not fetch list of nodes for service ${service}: ${err}`,
            })

            return reject(err)
          }
          resolve(result)
        }
      )
    })
  }

  public compareNodes(nodeOne: INode, nodeTwo: INode) {
    return nodeOne.ServiceID === nodeTwo.ServiceID
  }

  private fetchAllNodes = () => {
    Promise.all(this.servicesList.map(service => this.fetchNodes(service)))
      .then(nodes => {
        this.servicesList.forEach((service, index) => {
          if (this.services[service] === null) {
            this.services[service] = new RoundRobinEngine(
              nodes[index] as INode[]
            )
          } else {
            this.services[service].updatePool(
              nodes[index] as INode[],
              this.compareNodes
            )
          }
        })
      })
      .catch(() => {
        // ignore
      })
  }

  public pickNode = (service: string): INode => {
    if (!this.hasNode(service)) {
      throw new Error(`Service ${service} has no nodes`)
    }
    return this.services[service].pick()
  }

  public hasNode = (service: string): boolean => {
    return this.services[service] instanceof RoundRobinEngine
  }
}
