import { AppConfig, createApplicationContext } from '../../kit-dev/di/container.js';
import { infrastructureProviders } from './infrastructure-providers.js';
import { applicationProviders } from './application-providers.js';
import { controllerProviders } from './controller-providers.js';

const providers = new AppConfig().imports(
  infrastructureProviders,
  applicationProviders,
  controllerProviders,
);

export const container = createApplicationContext(providers);
