"""Command line tool to print discocvered devices or dump raw data."""
from pprint import pprint
import sys

from networkDiscovery.discovery import NetworkDiscovery


def main():
    """Handle command line execution."""
    networkDiscovery = NetworkDiscovery()

    networkDiscovery.scan()

    print("Discovered devices:")
    count = 0
    for dev in networkDiscovery.discover():
        count += 1
        print('{}:'.format(dev))
        pprint(networkDiscovery.get_info(dev))
        print()
    print("Discovered {} devices".format(count))

    # Pass in command line argument dump to get the raw data
    if sys.argv[-1] == 'dump':
        print()
        print()
        print("Raw Data")
        print()
        networkDiscovery.print_raw_data()

    networkDiscovery.stop()


if __name__ == '__main__':
    main()
