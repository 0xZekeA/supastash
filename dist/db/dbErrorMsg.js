export const supastashDbErrorMsg = "SQLite client not found. Please provide a SQLite client in the config. /n/n" +
    "Supastash supports the following SQLite clients: \n" +
    " - expo-sqlite \n" +
    " - react-native-nitro-sqlite \n" +
    " - react-native-sqlite-storage \n" +
    "\n\n" +
    "Add a SQLite client to your config and set the sqliteClientType to the client you are using. \n" +
    "Example: \n" +
    "import { openDatabaseAsync } from 'expo-sqlite';\n" +
    "configureSupastash({ \n" +
    "  sqliteClient: { openDatabaseAsync }, \n" +
    "  sqliteClientType: 'expo', \n" +
    "});" +
    "\n\n" +
    "or \n" +
    "import { open } from 'react-native-nitro-sqlite';\n" +
    "configureSupastash({ \n" +
    "  sqliteClient: { open }, \n" +
    "  sqliteClientType: 'rn-nitro', \n" +
    "});" +
    "\n\n" +
    "or \n" +
    "import { openDatabaseAsync } from 'react-native-sqlite-storage';\n" +
    "configureSupastash({ \n" +
    "  sqliteClient: { openDatabaseAsync }, \n" +
    "  sqliteClientType: 'rn-storage', \n" +
    "});" +
    "\n\n";
