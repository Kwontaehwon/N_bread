import { PrismaClient } from "@prisma/client";

const prisma:PrismaClient = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    // Change to findFirst - you cannot filter
    // by anything except ID / unique with findUnique
    params.action = 'findFirst';
    // Add 'deletedAt' filter
    // ID filter maintained
    params.args.where['deletedAt'] = null;
  }
  if (params.action === 'findMany') {
    // Find many queries
    if (params.args.where) {
      if (params.args.where.deletedAt == undefined) {
        // Exclude deletedAt records if they have not been explicitly requested
        params.args.where['deletedAt'] = null;
      }
    } else {
      params.args['where'] = { deletedAt: null };
    }
  }
  return next(params);
});

prisma.$use(async (params, next) => {
  if (params.action == 'update') {
    // Change to updateMany - you cannot filter
    // by anything except ID / unique with findUnique
    params.action = 'updateMany';
    // Add 'deletedAt' filter
    // ID filter maintained
    params.args.where['deletedAt'] = null;
  }
  if (params.action == 'updateMany') {
    if (params.args.where != undefined) {
      params.args.where['deletedAt'] = null;
    } else {
      params.args['where'] = { deletedAt: null };
    }
  }
  return next(params);
});

prisma.$use(async (params, next) => {
  // Check incoming query type
  const nowDate = new Date();
    if (params.action == 'delete') {
      console.log('my datetime : ' + new Date());

      // Delete queries
      // Change action to an update
      params.action = 'update';
      params.args['data'] = { deletedAt: nowDate };
      console.log('action : ' + params.action);
    }
  if (params.action == 'deleteMany') {
    // Delete many queries
    params.action = 'updateMany';
    if (params.args.data != undefined) {
      params.args.data['deletedAt'] = nowDate;
    } else {
      params.args['data'] = { deletedAt: nowDate };
    }
  }
  return next(params);
});

export default prisma;
