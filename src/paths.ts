import "module-alias/register";
import { addAliases } from "module-alias";

addAliases({
  $controllers: `${__dirname}/controllers`,
  $routes: `${__dirname}/routes`,
  $utils: `${__dirname}/utils`,
  $validations: `${__dirname}/validations`,
  $services: `${__dirname}/services`,
  $entities: `${__dirname}/entities`,
  $middlewares: `${__dirname}/middlewares`,
  $seeders: `${__dirname}/seeders`,
  $config: `${__dirname}/config`,
  $pkg : `${__dirname}/pkg`,
  $swagger: `${__dirname}/swagger`,
  $queues: `${__dirname}/queues`,
  $constants: `${__dirname}/constants`,
  $mappers : `${__dirname}/mappers`,
  $repositories : `${__dirname}/repositories`,
  $server : `${__dirname}/server`,
  $app : `${__dirname}/app`,
});
