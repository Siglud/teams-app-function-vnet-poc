import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { notificationApp } from "../internal/initialize";
import { TeamsBot } from "../teamsBot";
import { Request, Response } from "botbuilder";

export async function messages(
    request: HttpRequest,
    _: InvocationContext
  ): Promise<HttpResponseInit> {
  const res: HttpResponseInit = { status: 200 };
  const teamsBot = new TeamsBot();
  const response = {
    end: () => {},
    header: (name: string, value: unknown) => {
      res.headers = res.headers || {};
      res.headers[name] = value;
    },
    send: (body: unknown) => {
      res.body = body as string;
    },
    status: (code) => {
      res.status = code;
    },
    socket: {},
  } as Response;
  await notificationApp.requestHandler(await requestAdaptor(request), response, async (context) => {
    await teamsBot.run(context);
  });
  return res;
}

async function requestAdaptor(request: HttpRequest): Promise<Request> {
  return {
    body: request.json as any,
    headers: (await Promise.all(request.headers.entries())).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {}),
    method: request.method,
  };
}

app.get("messages", messages);