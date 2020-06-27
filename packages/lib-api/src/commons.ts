import { ConsulServices } from '@gtms/lib-consul'

const services = new ConsulServices()

export type IOptions = {
  traceId: string
}

export function makeUrl(service: string, path: string) {
  return services.addService(service).then(() => {
    const node = services.pickNode(service)

    return `http://${node.ServiceAddress}:${node.ServicePort}${path}`
  })
}
