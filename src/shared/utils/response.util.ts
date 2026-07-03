import {
  ApiResponse,
  PaginationResponse,
  PaginationData,
  ResponseCode,
  ResponseMessage,
  ErrorShowType,
} from '../interfaces/response.interface';

/**
 * 响应格式工具类
 */
export class ResponseUtil {
  /**
   * 构建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param code 响应状态码
   * @returns 统一响应格式
   */
  static success<T>(
    data: T,
    message: string = ResponseMessage.SUCCESS,
    code: number = ResponseCode.SUCCESS,
  ): ApiResponse<T> {
    return {
      success: true,
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 构建创建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 统一响应格式
   */
  static created<T>(
    data: T,
    message: string = ResponseMessage.CREATED,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.CREATED);
  }

  /**
   * 构建更新成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 统一响应格式
   */
  static updated<T>(
    data: T,
    message: string = ResponseMessage.UPDATED,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.SUCCESS);
  }

  /**
   * 构建删除成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 统一响应格式
   */
  static deleted<T>(
    data: T,
    message: string = ResponseMessage.DELETED,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.SUCCESS);
  }

  /**
   * 构建查询成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 统一响应格式
   */
  static found<T>(
    data: T,
    message: string = ResponseMessage.SUCCESS,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.SUCCESS);
  }

  /**
   * 构建分页响应
   * @param data 分页数据
   * @param message 响应消息
   * @returns 统一分页响应格式
   */
  static paginated<T>(
    data: PaginationData<T>,
    message: string = ResponseMessage.SUCCESS,
  ): PaginationResponse<T> {
    return {
      success: true,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 构建错误响应
   * @param message 错误消息
   * @param code 错误状态码
   * @param showType 错误展示类型
   * @returns 统一响应格式
   */
  static error(
    message: string,
    code: number = ResponseCode.INTERNAL_SERVER_ERROR,
    showType: ErrorShowType = ErrorShowType.ERROR_MESSAGE,
  ): ApiResponse<null> {
    return {
      success: false,
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      showType,
    };
  }

  /**
   * 构建请求错误响应
   * @param message 错误消息
   * @param showType 错误展示类型
   * @returns 统一响应格式
   */
  static badRequest(
    message: string = ResponseMessage.BAD_REQUEST,
    showType: ErrorShowType = ErrorShowType.ERROR_MESSAGE,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.BAD_REQUEST, showType);
  }

  /**
   * 构建未授权响应
   * @param message 错误消息
   * @param showType 错误展示类型
   * @returns 统一响应格式
   */
  static unauthorized(
    message: string = ResponseMessage.UNAUTHORIZED,
    showType: ErrorShowType = ErrorShowType.NOTIFICATION,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.UNAUTHORIZED, showType);
  }

  /**
   * 构建禁止访问响应
   * @param message 错误消息
   * @param showType 错误展示类型
   * @returns 统一响应格式
   */
  static forbidden(
    message: string = ResponseMessage.FORBIDDEN,
    showType: ErrorShowType = ErrorShowType.NOTIFICATION,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.FORBIDDEN, showType);
  }

  /**
   * 构建资源不存在响应
   * @param message 错误消息
   * @param showType 错误展示类型
   * @returns 统一响应格式
   */
  static notFound(
    message: string = ResponseMessage.NOT_FOUND,
    showType: ErrorShowType = ErrorShowType.ERROR_MESSAGE,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.NOT_FOUND, showType);
  }
}
