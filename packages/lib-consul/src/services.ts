import { consul } from './consul'
import logger from '@gtms/lib-logger'
import { RoundRobinEngine } from '@gtms/commons'

export interface INode {
  Node: string
  Address: string
  ServiceID: string
  ServiceAddress: string
  ServiceName: string
  ServiceTags: string[]
  ServicePort: number
}

export class ConsulServices {
  private services: {
    [service: string]: RoundRobinEngine | null
  }

  constructor(private servicesList: string[]) {
    this.services = servicesList.reduce(
      (all: { [service: string]: null }, service) => {
        all[service] = null

        return all
      },
      {}
    )

    this.initWatchers()
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

  private initWatchers = () => {
    this.servicesList.forEach(service => {
      const watch = consul.watch({
        method: consul.catalog.service.nodes,
        options: { service } as any, // TS typings are wrong
        backoffFactor: 1000,
      })

      watch.on('change', data => {
        console.log(data)
        logger.log({
          level: 'info',
          message: `Got a new data from consul about ${service} service, nodes: ${data.length}`,
        })
        this.services[service] = new RoundRobinEngine(data)
      })

      watch.on('error', () => null)
    })
  }

  public fetchAllNodes = () => {
    return Promise.all(
      this.servicesList.map(service => this.fetchNodes(service))
    )
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
