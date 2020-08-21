import fetch from 'node-fetch'
import { makeUrl, IOptions } from './commons'
import { ISerializedGroup } from '@gtms/commons'

const GROUPS_SERVICE = 'groups'

export const canAddPost = (
  user: string,
  group: string,
  options: IOptions
): Promise<void> => {
  const { traceId } = options
  return makeUrl(
    GROUPS_SERVICE,
    `/can-add-post?user=${user}&group=${group}`
  ).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        return
      }

      throw await res.text()
    })
  })
}

export const hasGroupAdminRights = (
  user: string,
  group: string,
  options: IOptions
): Promise<void> => {
  const { traceId } = options
  return makeUrl(
    GROUPS_SERVICE,
    `/check-admin-rights?user=${user}&group=${group}`
  ).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'GET',
    }).then(res => {
      if (res.status === 200) {
        return
      }

      throw res.status
    })
  })
}

export const findGroupsByIds = (
  ids: string[],
  options: IOptions
): Promise<ISerializedGroup[]> => {
  const { traceId } = options
  return makeUrl(GROUPS_SERVICE, '/find-by-ids').then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'POST',
      body: JSON.stringify({ ids }),
    }).then(async res => {
      if (res.status === 200) {
        return res.json()
      }

      throw await res.text()
    })
  })
}

export const getGroup = (
  idOrSlug: string,
  options: IOptions
): Promise<ISerializedGroup> => {
  const { traceId } = options

  return makeUrl(GROUPS_SERVICE, `/${idOrSlug}`).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        return res.json()
      }

      throw await res.text()
    })
  })
}

export const getGroupAdmins = (idOrSlug: string, options: IOptions) => {
  const { traceId } = options

  return makeUrl(GROUPS_SERVICE, `/${idOrSlug}/admins?onlyIds=1`).then(url => {
    return fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-traceid': traceId,
      },
      method: 'GET',
    }).then(async res => {
      if (res.status === 200) {
        return res.json()
      }

      throw await res.text()
    })
  })
}
