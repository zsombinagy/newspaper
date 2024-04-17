import { Schema, string, z } from "zod";
import { Client } from "pg";

export const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  image: z.string(),
  counter: z.number(),
});

type Response<Data> =
  | {
      success: true;
      status: number;
      data: Data;
    }
  | {
      success: false;
      status: number;
    };

export const client = new Client({
  connectionString:
    "postgresql://zsombinagy:Aucxj2q6hXDH@ep-little-water-a57bcge1.us-east-2.aws.neon.tech/neondb?sslmode=require",
});

const clientQuery = async <Schema extends z.ZodTypeAny>(params: string, schema: Schema ): Promise<Response<z.infer<typeof schema>>> => {
  let response;
  try {
    response = await client.query(params);
  } catch (error) {
    console.log(error)
    return {
      success: false,
      status: 500,
    };


    

  }
  let result = schema.safeParse(response.rows)

  if (!result.success) {
    console.log(result.error) 
    return {
      success: false,
      status: 400,
    };
  }
 
  return {
    success: true,
    status: 200,
    data: result.data,
  };
};

export const selectQuery = async <Schema extends z.ZodTypeAny>(
  table: string,
  schema: Schema,
  object?: { id: string; property: string }
): Promise<Response<z.infer<typeof schema>>> => {
  if (object !== undefined) {

    const response = await clientQuery(
      `SELECT ${object.property} FROM ${table} WHERE id = '${object.id}'
      
      `
    , schema);
    if (!response.success)
      return {
        success: false,
        status: response.status,
      };

    let data = response.data;

    return {
      success: true,
      status: response.status,
      data: data,
    };
  }
  const response = await clientQuery(`SELECT * FROM ${table}`, schema);
  if (!response.success)
    return {
      success: false,
      status: response.status,
    };

  let data = response.data;


  return {
    success: true,
    status: response.status,
    data: data,
  };
};

const formatQueryParams = (params: string): string => {
  return params.split("'").join("''");
};

type insertObjectType<T> = {
  [key: string]: T;
};


export const insertQuery = async (
  table: string,
  object: insertObjectType<string | number | boolean | Date>,
  schema: Schema
): Promise<Response<z.infer<typeof schema>>> => {
  let propertyListing: string[] = [];
  let valuesListing: (string | number | boolean | Date)[] = [];
  for (const key in object) {
    propertyListing = [...propertyListing, key];
    if (typeof object[key] === "string") {
      valuesListing = [...valuesListing, formatQueryParams(object[key] as string),
      ];
    } else {
      valuesListing = [...valuesListing, object[key]];
    }
  }

  const response = await clientQuery(
    `INSERT INTO ${table} (${propertyListing.join(",")})
    VALUES (${valuesListing.map((value) => `'${value}'`).join(", ")})
    RETURNING id   
    `, schema
  );

  if (!response.success)
    return {
      success: false,
      status: response.status,
    };

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
};

export const updateQuery = async (
  table: string,
  object: insertObjectType<number | string | boolean>,
  schema: Schema,
  id: string
): Promise<Response<z.infer<typeof schema>>> => {

  let dataToBeUpdated: string[] = []
  for (const key in object) {
    
    if (typeof object[key] === "string") {
      let keyValuePairsInCorrectForm = `${key} = '${formatQueryParams(object[key] as string)}'`
      dataToBeUpdated = [...dataToBeUpdated, keyValuePairsInCorrectForm]
    } else {
      let keyValuePairsInCorrectForm = `${key} = '${object[key]}'`
      dataToBeUpdated = [...dataToBeUpdated, keyValuePairsInCorrectForm]
    }
  }

  
  const response = await clientQuery(
    `UPDATE ${table} SET ${dataToBeUpdated.join(", ")} WHERE id = '${id}'
    RETURNING id
    `, schema
  )


  if (!response.success)
    return {
      success: false,
      status: response.status,
    };

  return {
    success: true,
    status: response.status,
    data: "Success",
  }; 
};

export const deleteQuery = async (table: string, keyValuePair: {[key: string]: string}, schema: Schema): Promise<Response<z.infer<typeof schema>>> => {
  const key = Object.keys(keyValuePair)[0]

  const response = await clientQuery(`DELETE FROM ${table} WHERE ${key} = '${keyValuePair[key]}' RETURNING id`, schema);
  if (!response.success)
    return {
      success: false,
      status: response.status,
    };

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
};
