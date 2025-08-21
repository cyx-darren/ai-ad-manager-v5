/**
 * Pagination middleware for API endpoints
 * Adds pagination parameters and helper functions to request object
 */

export const paginationMiddleware = (defaultLimit = 50, maxLimit = 1000) => {
  return (req, res, next) => {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(
      maxLimit, 
      Math.max(1, parseInt(req.query.limit) || defaultLimit)
    )
    const offset = (page - 1) * limit

    // Add pagination info to request
    req.pagination = {
      page,
      limit,
      offset,
      maxLimit
    }

    // Add helper functions
    req.pagination.getPaginationMeta = (totalCount) => ({
      currentPage: page,
      pageSize: limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPreviousPage: page > 1,
      nextPage: page < Math.ceil(totalCount / limit) ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    })

    // Add pagination headers helper
    res.setPaginationHeaders = (totalCount) => {
      const meta = req.pagination.getPaginationMeta(totalCount)
      res.set({
        'X-Total-Count': totalCount.toString(),
        'X-Total-Pages': meta.totalPages.toString(),
        'X-Current-Page': meta.currentPage.toString(),
        'X-Page-Size': meta.pageSize.toString()
      })
    }

    next()
  }
}

/**
 * Apply pagination to Supabase query
 * @param {object} query - Supabase query builder
 * @param {object} pagination - Pagination object from middleware
 * @returns {object} - Modified query with pagination
 */
export const applyPagination = (query, pagination) => {
  return query.range(pagination.offset, pagination.offset + pagination.limit - 1)
}

export default paginationMiddleware