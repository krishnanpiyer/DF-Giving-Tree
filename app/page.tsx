'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type InventoryItem = {
  id: number;
  assetName: string;
  deviceType: string;
  make: string;
  model: string;
  year: string;
  specs: string;
  shelterName: string;
  clientPreference1: string;
  clientPreference2: string;
  clientPreference3: string;
  availability: 'available' | 'unavailable';
}

const shelters = [
  "New Bethlehem - Family Shelter",
  "FOY - Youth Shelter",
  "ROOTS - Young Adult Shelter near UW",
  "Sophia Way - Women's Shelter",
  "Porchlight - Men's Shelter"
]

export default function LaptopReservationSystem() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [shelterName, setShelterName] = useState('')
  const [clientId, setClientId] = useState('')
  const [preference, setPreference] = useState<1 | 2 | 3>(1)
  const [userReservations, setUserReservations] = useState<{[key: string]: {[key: string]: string[]}}>({})
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    setFilteredInventory(
      inventory.filter(item => 
        Object.values(item).some(value => 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    )
  }, [searchTerm, inventory])

  const fetchInventory = async () => {
    try {
      const response = await fetch('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/10-31-24%20Laptop%20ipad%20inventory%20for%20donations-X2rmxIAhjdpz3els9GkZ3PAeEV6d3L.csv')
      const csvText = await response.text()
      const parsedInventory = parseCSV(csvText)
      setInventory(parsedInventory)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const parseCSV = (csvText: string): InventoryItem[] => {
  const lines = csvText.split('\n');
  const headers = lines[1].split(',');

  return lines.slice(2).map((line, index) => {
    const values = line.split(',');

    // Determine the correct availability value
    let availability: 'available' | 'unavailable' = 'available';
    if (values[7] && values[7].toLowerCase().trim() === 'unavailable') {
      availability = 'unavailable';
    }

    return {
      id: index,
      assetName: values[0],
      deviceType: values[1],
      make: values[3],
      model: values[4],
      year: values[5],
      specs: values[6],
      shelterName: '',
      clientPreference1: '',
      clientPreference2: '',
      clientPreference3: '',
      availability,
    };
  });
};


  const handleReservation = () => {
  if (selectedItem && shelterName && clientId) {
    const userKey = `${shelterName}-${clientId}`;
    const currentUserReservations = userReservations[userKey] || {};
    const deviceTypeReservations = currentUserReservations[selectedItem.deviceType] || [];

    if (deviceTypeReservations.length >= 2) {
      alert("You've already selected two preferences for this device type.");
      return;
    }

    const updatedInventory = inventory.map(item => {
      if (item.id === selectedItem.id) {
        const updatedItem = {
          ...item,
          shelterName,
          [`clientPreference${preference}`]: clientId,
          availability: preference === 1 ? 'unavailable' : item.availability, // Ensure it's either available or unavailable
        };
        return updatedItem;
      }
      return item;
    });

    setInventory(updatedInventory);

    // Update user reservations
    setUserReservations(prev => ({
      ...prev,
      [userKey]: {
        ...currentUserReservations,
        [selectedItem.deviceType]: [...deviceTypeReservations, selectedItem.id.toString()],
      },
    }));

    setSelectedItem(null);
    setShelterName('');
    setClientId('');
    setPreference(1);
    console.log('Reservation made:', { itemId: selectedItem.id, shelterName, clientId, preference });
  }
};


  const handleChangeReservation = (item: InventoryItem) => {
    setSelectedItem(item)
    setShelterName(item.shelterName)
    setClientId(item.clientPreference1)
    setPreference(1)
  }

const handleRemoveReservation = () => {
  if (selectedItem) {
    const updatedInventory = inventory.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          shelterName: '',
          clientPreference1: '',
          clientPreference2: '',
          clientPreference3: '',
          availability: 'available' as 'available' | 'unavailable', // Explicitly set the type to avoid the issue
        };
      }
      return item;
    });

    setInventory(updatedInventory);

    // Remove the reservation from userReservations
    const userKey = `${selectedItem.shelterName}-${selectedItem.clientPreference1}`;
    const updatedUserReservations = { ...userReservations };
    if (updatedUserReservations[userKey] && updatedUserReservations[userKey][selectedItem.deviceType]) {
      updatedUserReservations[userKey][selectedItem.deviceType] = updatedUserReservations[userKey][selectedItem.deviceType].filter(id => id !== selectedItem.id.toString());
    }
    setUserReservations(updatedUserReservations);

    setSelectedItem(null);
    setShelterName('');
    setClientId('');
    setPreference(1);
    setShowRemoveDialog(false);
    console.log('Reservation removed:', { itemId: selectedItem.id });
  }
};


  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <Card className="mb-6 shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Laptop and iPad Reservation System</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="mb-4">
            <Label htmlFor="search" className="text-lg font-semibold mb-2 block">Search Inventory</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by make, model, specs, etc."
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <p>Total Items: {inventory.length}</p>
            <p>Filtered Items: {filteredInventory.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="font-bold">Asset Name</TableHead>
                <TableHead className="font-bold">Device Type</TableHead>
                <TableHead className="font-bold">Make</TableHead>
                <TableHead className="font-bold">Model</TableHead>
                <TableHead className="font-bold">Year</TableHead>
                <TableHead className="font-bold">Specs</TableHead>
                <TableHead className="font-bold">Availability</TableHead>
                <TableHead className="font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>{item.assetName}</TableCell>
                  <TableCell>{item.deviceType}</TableCell>
                  <TableCell>{item.make}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.year}</TableCell>
                  <TableCell>{item.specs}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.availability === 'available' ? 'success' : 'destructive'}
                      className={`${item.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded-full text-xs font-semibold`}
                    >
                      {item.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => item.clientPreference1 ? handleChangeReservation(item) : setSelectedItem(item)}
                          variant={item.clientPreference1 ? "secondary" : "default"}
                          className="w-full"
                        >
                          {item.clientPreference1 ? 'Change' : 'Reserve'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{item.clientPreference1 ? 'Change Reservation' : 'Reserve Item'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="shelterName" className="text-right">
                              Shelter Name
                            </Label>
                            <Select onValueChange={setShelterName} value={shelterName}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select shelter" />
                              </SelectTrigger>
                              <SelectContent>
                                {shelters.map((shelter) => (
                                  <SelectItem key={shelter} value={shelter}>
                                    {shelter}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clientId" className="text-right">
                              Client ID/Name
                            </Label>
                            <Input
                              id="clientId"
                              value={clientId}
                              onChange={(e) => setClientId(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="preference" className="text-right">
                              Preference
                            </Label>
                            <Select onValueChange={(value) => setPreference(parseInt(value) as 1 | 2 | 3)} value={preference.toString()}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select preference" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1st Choice</SelectItem>
                                <SelectItem value="2">2nd Choice</SelectItem>
                                <SelectItem value="3">3rd Choice</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter className="flex justify-between">
                          {item.clientPreference1 && (
                            <Button variant="destructive" onClick={() => setShowRemoveDialog(true)}>
                              Remove Reservation
                            </Button>
                          )}
                          <Button onClick={handleReservation}>
                            {item.clientPreference1 ? 'Update Reservation' : 'Submit Reservation'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRemoveDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveReservation}>Remove Reservation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
