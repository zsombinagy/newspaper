import { string, z } from "zod";
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

const clientQuery = async (params: string) => {
  let response;
  try {
    response = await client.query(params);
  } catch (error) {
    return {
      success: false,
      status: 500,
    };
  }
  return {
    success: true,
    status: 200,
    data: response.rows,
  };
};

export const selectQuery = async <Schema extends z.ZodTypeAny>(
  table: string,
  schema: Schema,
  object?: { id: string; property: string }
): Promise<Response<z.infer<typeof schema>>> => {
  if (object !== undefined) {
    const response = await clientQuery(
      `SELECT ${object.property} FROM ${table} WHERE id = '${object.id}'`
    );
    if (!response.success)
      return {
        success: false,
        status: response.status,
      };

    let data = response.data;
    let result = schema.safeParse(data);
    if (!result.success) {
      console.log(result.error);
      return {
        success: false,
        status: 400,
      };
    }

    return {
      success: true,
      status: response.status,
      data: result.data,
    };
  }
  const response = await clientQuery(`SELECT * FROM ${table}`);
  if (!response.success)
    return {
      success: false,
      status: response.status,
    };

  let data = response.data;
  let result = schema.safeParse(data);
  if (!result.success) {
    console.log(result.error);
    return {
      success: false,
      status: 400,
    };
  }

  return {
    success: true,
    status: response.status,
    data: result.data,
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
  object: insertObjectType<string | number>
) => {
  let propertyListing: string[] = [];
  let valuesListing: (number | string)[] = [];
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
    
    `
  );
  /*   const checkIfIdIsOnItem = "id" in item;

  const response = await clientQuery(
    `INSERT INTO ${table} (${
      checkIfIdIsOnItem === true ? "id," : ""
    }title, price, description, image, counter)
     VALUES (${checkIfIdIsOnItem ? `'${item.id}',` : ""} '${formatQueryParams(
      item.title
    )}', '${+item.price}', '${formatQueryParams(item.description)}',
     '${formatQueryParams(item.image)}', '${
      checkIfIdIsOnItem === true ? "1" : "0"
    }')`
  );  */
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

export const updateQuery = async (
  table: string,
  object: insertObjectType<number | string>
) => {

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
    `UPDATE ${table} SET ${dataToBeUpdated.join(", ")}`
  )

/*   const checkIfTitleIsOnItem = "title" in object;
  if (checkIfTitleIsOnItem) {
    const response = await clientQuery(
      `UPDATE ${table} SET title = '${formatQueryParams(
        object.title
      )}', price = '${+object.price}', description = '${formatQueryParams(
        object.description
      )}', image = '${formatQueryParams(object.image)}' WHERE id = '${
        object.id
      }'`
    );
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
  }

  const response = await clientQuery(`
  UPDATE ${table} SET counter = counter ${
    object.plus === true ? "+" : "-"
  } 1 WHERE id = '${object.id}'
  `); */

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

export const deleteQuery = async (table: string, id: string) => {
  const response = await clientQuery(`DELETE FROM ${table} WHERE id = '${id}'`);
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
