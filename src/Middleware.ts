import { Middleware } from 'redux'
import * as _ from 'lodash'

export interface MiddlewareConfig {
  dispatchLifecycleActions: boolean
}

const defaultConfig: MiddlewareConfig = {
  dispatchLifecycleActions: true
}

export const buildAClassyMiddleware = (
  config?: Partial<MiddlewareConfig>
): Middleware => ({ dispatch, getState }) => next => action => {
  const { dispatchLifecycleActions } = Object.assign(defaultConfig, config)

  const actionIsAClass = !_.isPlainObject(action)
  if (actionIsAClass) {
    const actionAsObject = extractNonFunctionFields(action)

    const isAsynchronousAction = _.isFunction(action.perform)
    if (isAsynchronousAction) {
      if (dispatchLifecycleActions) {
        dispatch({
          actionData: actionAsObject,
          type: action.constructor.OnStart
        })
      }
      return action
        .perform(dispatch, getState)
        .then(
          (successResult: any) =>
            dispatchLifecycleActions &&
            dispatch({
              actionData: actionAsObject,
              type: action.constructor.OnSuccess,
              successResult
            })
        )
        .catch(
          (errorResult: any) =>
            dispatchLifecycleActions &&
            dispatch({
              actionData: actionAsObject,
              type: action.constructor.OnError,
              errorResult
            })
        )
        .finally(
          () =>
            dispatchLifecycleActions &&
            dispatch({
              actionData: actionAsObject,
              type: action.constructor.OnComplete
            })
        )
    } else {
      return next({ ...actionAsObject })
    }
  } else {
    return next(action)
  }
}

const extractNonFunctionFields = (obj: any) => {
  const cleanedObj: any = {}
  Object.keys(obj)
    .filter(key => !_.isFunction(obj[key]))
    .forEach(key => {
      cleanedObj[key] = obj[key]
    })
  return cleanedObj
}
