import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {registerHeadlessTask} from './src/services/BackgroundWorkerService';

AppRegistry.registerComponent(appName, () => App);
registerHeadlessTask();
